import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// explicitly load .env from root folder
dotenv.config({ path: path.resolve('C:/Users/Lenovo/OneDrive/Desktop/Projects/SmartBank/.env') });

//Using a pool reuses a set of database connections for multiple requests, while without a pool each request opens a new connection, which is slower and less efficient.

export const mysql_db = await mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
});

export const connectDB = async () => {
  try {
    await mysql_db.getConnection();
    console.log("Database connected");
    return mysql_db;
  } catch (error) {
    console.error("Error in DB", error);
    process.exit(1);
  }
};
