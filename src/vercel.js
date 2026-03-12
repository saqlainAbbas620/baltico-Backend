// Vercel serverless entry point — exports the Express app directly.
// Vercel manages the HTTP server; calling app.listen() is not needed.
import { configDotenv } from "dotenv";
configDotenv();

import { connectDB } from "./config/db.js";
import { app } from "./app.js";

// Connect to MongoDB once (Vercel may reuse this across warm invocations)
connectDB().catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
});

export default app;
