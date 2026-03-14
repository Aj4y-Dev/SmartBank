import { mysql_db } from "../config/db.js";
import {getAccountBalance} from "../services/account.service.js"
import {sendTransactionEmail} from "../services/email.service.js"

/*
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MySQL transaction
     * 10. Send email notification
 */

export const createTransaction =async (req, res) => {
    //1. Validate request
    const {from_account, to_account, amount, idempotency_key} = req.body;

    if(!from_account || !to_account || !amount || !idempotency_key) {
        return res.status(400).json({
            message: "All field required"
        })
    }

    if (amount <= 0) {
        return res.status(400).json({
            message: "Amount must be greater than 0"
        });
    }

    if (from_account === to_account) {
        return res.status(400).json({
            message: "Cannot transfer to the same account"
        });
    }

    let connection;

    try {
        connection = await mysql_db.getConnection();

        await connection.beginTransaction();

        const [fromRows] = await connection.query("SELECT * FROM accounts WHERE id = ? FOR UPDATE", [from_account]);

        const [toRows] = await connection.query("SELECT * FROM accounts WHERE id = ? FOR UPDATE", [to_account]);

        if(fromRows.length === 0 || toRows.length ===0) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            })
        }
    
        const fromAccount = fromRows[0];
        const toAccount = toRows[0];

        //2. Validate idempotency key
        const [existingTx] = await connection.query("SELECT * FROM transactions WHERE idempotency_key = ?", [idempotency_key]);


        if(existingTx.length > 0) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }

            const tx = existingTx[0];

                if(tx.status === "COMPLETED"){
                    return res.status(200).json({
                        message: "Transaction already processed",
                        transaction: tx
                    })
                }

                if(tx.status === "PENDING") {
                    return res.status(202).json({
                        message: "Transaction is still processing",
                        transaction: tx
                    })
                }

                if(tx.status === "FAILED") {
                    return res.status(422).json({
                        message: "Transaction processing failed, please retry",
                        transaction: tx
                     })
                }

                if(tx.status === "REVERSED") {
                    return res.status(422).json({
                        message: "Transaction was reversed, please retry",
                        transaction: tx
                    })
                }
                
            // Catch-all for any unknown status    
             return res.status(409).json({ message: "Duplicate idempotency key.", transaction: tx });   
        }

        //3. Check account status
        if (fromAccount.status !== "ACTIVE") {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({ message: "Sender account is not ACTIVE." });
        }

        if (toAccount.status !== "ACTIVE") {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({ message: "Recipient account is not ACTIVE." });
        }

        //4. Derive sender balance from ledger 
        const balance = await getAccountBalance(from_account, connection);

        if(balance < amount) {
            if (connection) {
                await connection.rollback();
                connection.release();
            }
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            })
        }

        // 5. Create transaction (PENDING)
        const [txResult] = await connection.query(
            `INSERT INTO transactions (from_account, to_account, amount, idempotency_key, status)
            VALUES (?, ?, ?, ?, 'PENDING')`,
            [from_account, to_account, amount, idempotency_key]
        );

        const transactionId = txResult.insertId;

        //6. Create DEBIT ledger entry
        await connection.query(
            `INSERT INTO ledgers (account, transaction, amount, type)
            VALUES (?, ?, ?, 'DEBIT')`,
            [from_account, transactionId, amount]
        );

        //7. Create CREDIT ledger entry
        await connection.query(
            `INSERT INTO ledgers (account, transaction, amount, type)
            VALUES (?, ?, ?, 'CREDIT')`,
            [to_account, transactionId, amount]
        );

        //8. Mark transaction COMPLETED
        await connection.query(
            `UPDATE transactions SET status='COMPLETED' WHERE id=?`,
            [transactionId]
        );

        // 9. Commit MySQL transaction
        await connection.commit();
        connection.release();

        //10. Send email notification
        try {
            await sendTransactionEmail(
                req.user.email,
                req.user.name,
                amount,
                to_account
            );
        } catch (emailError) {
            console.error(`[Transaction ${transactionId}] Email notification failed:`, emailError.message);
        }

        return res.status(201).json({
            message: "Transaction completed successfully",
            transactionId
        });

    } catch (error) {

        if (connection) {
            await connection.rollback();
            connection.release();
        }

        console.error("[createTransaction] Unexpected error:", error);

        return res.status(500).json({
            message: "Transaction failed",
            error: error.message
        });
    }
}