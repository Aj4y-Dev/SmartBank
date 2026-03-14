import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { handleCreateAccount, getuserAccounts, getAccountBalance}  from "../controllers/account.controller.js";

const accountRouter = express.Router();

//- POST /api/accounts/ - Create a new account & Protected 
accountRouter.post("/", authMiddleware, handleCreateAccount);

//-GET /api/accounts/ - Get all accounts of the logged-in user & Protected 
accountRouter.get("/", authMiddleware, getuserAccounts);

//- GET /api/accounts/balance/:accountId - Get balance by id & protected
accountRouter.get("/balance/:accountId", authMiddleware, getAccountBalance)

export default accountRouter;