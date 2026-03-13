import dotenv from "dotenv";

dotenv.config();

import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(4000, () => {
      console.log("Server is listening on port 4000");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
