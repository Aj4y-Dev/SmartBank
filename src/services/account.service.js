import { mysql_db } from "../config/db.js";

export async function getAccountBalance(accountId) {
  const [rows] = await mysql_db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type='CREDIT' THEN amount ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN type='DEBIT' THEN amount ELSE 0 END),0) 
        AS balance
      FROM ledger
      WHERE account_id = ?
  `, [accountId]);

  return rows[0].balance || 0;
}
