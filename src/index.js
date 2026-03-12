// import { configDotenv } from "dotenv";
// configDotenv();

// import {app} from "./app.js";
// import {connectDB} from "./config/db.js";


// // let isConnected = false

// // app.use((req, res, next)=>{
// //     if(!isConnected){
// //         connectDB()
// //     }
// //     next();
// // })
// connectDB()
// .then(() => {
//     app.listen(process.env.PORT, () => {
//         console.log(`Server is running on port ${process.env.PORT}`);
//     });
// })
// .catch((error) => {
//     console.error("Failed to connect to the database:", error);
// });

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