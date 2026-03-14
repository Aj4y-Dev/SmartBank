import { mysql_db } from "../config/db.js";
import {getAccountBalance} from "../services/account.service.js"
import {sendTransactionEmail} from "../services/email.service.js"

/**
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
     * 9. Commit mysqldb session
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

    try {
        const [fromUser] = await mysql_db.query("SELECT * FROM accounts WHERE id = ?", [from_account]);

        const [toUser] = await mysql_db.query("SELECT * FROM accounts WHERE id = ?", [to_account]);

    if(fromUser.length === 0 || toUser.length ===0) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }
    
    const fromUserAccount = fromRows[0];
    const toUserAccount = toRows[0];

    //2. Validate idempotency key
    const [existingTx] = await mysql_db.query("SELECT * FROM transactions WHERE idempotency_key = ?", [idempotency_key]);


    if(existingTx > 0) {
        const tx = existingTx[0];
        if(tx.status === "COMPLETED"){
            return res.status(400).json({
                message: "Transaction already processed",
                transaction: tx
            })
        }

        if(tx.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if(tx.status === "FAILED") {
             return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if(tx.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    //3. Check account status
    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    //4. Derive sender balance from ledger
    const balance = await getAccountBalance(from_account);

    if(balance < amount) {
         return res.status(400).json({
            message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
        })
    }

    // Start SQL transaction
    await mysql_db.beginTransaction();

    // 5. Create transaction (PENDING)
    const [txResult] = await mysql_db.query(
      `INSERT INTO transactions
       (from_account, to_account, amount, idempotency_key, status)
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [from_account, to_account, amount, idempotency_key]
    );

    const transactionId = txResult.insertId;

    //6. Create DEBIT ledger entry
    await mysql_db.query(
        `INSERT INTO ledgers (account, transaction, amount, type)
        VALUES (?, ?, ?, 'DEBIT')`,
        [from_account, transactionId, amount]
    );

    // Simulate delay 
    await new Promise(resolve => setTimeout(resolve, 15000));

    //7. Create CREDIT ledger entry
    await mysql_db.query(
        `INSERT INTO ledgers (account, transaction, amount, type)
        VALUES (?, ?, ?, 'CREDIT')`,
        [to_account, transactionId, amount]
    );

    //8. Mark transaction COMPLETED
    await mysql_db.query(
        `UPDATE transactions SET status='COMPLETED' WHERE id=?`,
        [transactionId]
    );

    // 9. Commit MySQL transaction
    await mysql_db.commit();

    //10. Send email notification
    await sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      to_account
    );

    return res.status(201).json({
      message: "Transaction completed successfully",
      transactionId: transactionId
    });

    } catch (error) {
        
    }
}