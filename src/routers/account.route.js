import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { handleCreateAccount } from "../controllers/account.controller.js";

const accountRouter = express.Router();

accountRouter.post("/", authMiddleware, handleCreateAccount)

export default accountRouter;