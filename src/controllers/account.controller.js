import { mysql_db } from "../config/db.js";

export const handleCreateAccount = async (req, res) => {
    const user = req.user;

    try {
        //insert a new accout
        const [result] = await mysql_db.query("INSERT INTO accounts (user_id) VALUES (?)", [user.id]);

        //get the created account
        const [rows] = await mysql_db.query("SELECT * FROM accounts WHERE id = ?", [result.insertId]);

        res.status(201).json({
            account: rows[0]
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}