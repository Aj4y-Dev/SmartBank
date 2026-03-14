import express from "express";
import { handleUserLogin, handleUserRegister,handleUserLogout } from "../controllers/user.controller.js";

const authRouter = express.Router();

//- POST /api/auth/register 
authRouter.post("/register", handleUserRegister);

//- POST /api/auth/login 
authRouter.post("/login", handleUserLogin);

//- POST /api/auth/logout 
authRouter.post("/logout", handleUserLogout);

export default authRouter;
