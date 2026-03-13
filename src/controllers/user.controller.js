import { connectDB } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const handleUserRegister = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const db = await connectDB();

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if(user.length > 0) {
      return res.status(400).json({
        sucess:false,
        message: "User already exists"
      })
    };

    const hashpassword = await bcrypt.hash(password, 10);

    const [result] = await db.query("INSERT INTO users (email, name, password) VALUES (?,?,?)", [email, name, hashpassword]);

    res.status(201).json({
      sucess: true,
      user: {
         id: result.insertId ,
         email: email,
        name: name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Register error",
      error: error.message,
    });
  }
};

export const handleUserLogin = async(req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const db = await connectDB();

    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if(user.length === 0) {
       return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const dbUser = user[0];
    const match = await bcrypt.compare(password, dbUser.password);

    if(!match) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id : dbUser.insertId,
        name: dbUser.name
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    )

      res.status(200).json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
      },
      token:token
    });
  } catch (error) {
      res.status(500).json({
      success: false,
      message: "Login error",
      error: error.message,
    });
  }
}
