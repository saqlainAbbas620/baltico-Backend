import { configDotenv } from "dotenv";
configDotenv();

import {app} from "./app.js";
import {connectDB} from "./config/db.js";


// let isConnected = false

// app.use((req, res, next)=>{
//     if(!isConnected){
//         connectDB()
//     }
//     next();
// })
connectDB()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("Failed to connect to the database:", error);
});