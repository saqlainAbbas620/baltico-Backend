import mongoose from "mongoose";


export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(`${process.env.MONGO_DB}/${process.env.DB_NAME}`); 
    console.log("Connected to MongoDB:", connection.connection.host);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); 
  }
};
