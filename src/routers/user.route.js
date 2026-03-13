import express from "express";
import { handleUserLogin, handleUserRegister } from "../controllers/user.controller.js";

const authRouter = express.Router();

authRouter.post("/register", handleUserRegister);
authRouter.post("/login", handleUserLogin);

export default authRouter;
