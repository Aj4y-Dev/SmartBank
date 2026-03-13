import express from "express";
import cookieParser from "cookie-parser";

// - Routes required
import authRouter from "./routers/user.route.js";
import accountRouter from "./routers/account.route.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// - Use Routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);

export default app;
