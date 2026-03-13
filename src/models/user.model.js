import { connectDB } from "../config/db.js";

//Resource: https://stackoverflow.com/questions/34039489/how-to-create-mysql-schema-in-nodejs

export const createUserTable = async () => {
  try {
    const connection = await connectDB();
    await connection.execute(`
            CREATE TABLE IF NOT EXISTS users(
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL ,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CHECK (CHAR_LENGTH(password) >= 6)
            )
            `);
    console.log(`User Table created successfully`);
  } catch (error) {
    console.log(`Error to create a User Table`, error);
    process.exit(1);
  }
};

await createUserTable();

// const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// if (!emailRegex.test(email)) {
//   throw new Error("Invalid email format");
// }
