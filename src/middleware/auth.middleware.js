import { mysql_db } from "../config/db.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decode.id;

        // console.log(userId);

         // Using existing pool instead of connecting every time
        const [rows] = await mysql_db.query("SELECT * FROM users WHERE id = ?", [userId]);

        if (!rows.length) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = rows[0];

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
};  

export const authSystemUsermiddleware = async(req, res, next) => {
    
};