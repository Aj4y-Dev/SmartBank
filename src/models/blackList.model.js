import { connectDB } from "../config/db.js";

export const createTokenBlacklistTable = async () => {
    try {
        const connection = await connectDB();
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS token_blacklist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                token TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_token (token(255)),  
                INDEX idx_expires (expires_at)
            )
        `);
        console.log("Token blacklist table created successfully");
    } catch (error) {
        console.log("Error creating token blacklist table", error);
        process.exit(1);
    }
};

await createTokenBlacklistTable();