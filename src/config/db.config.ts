import mongoose from "mongoose";
import { APP_CONFIG } from "../env";

/** 
 * Connects to MongoDB using the URI from environment configuration.
 * Exits the process if connection fails.
 */
export const connectToMongoDB = async () => {
  try {
    if (!APP_CONFIG.MONGO_URI) {
      throw new Error("MONGO_URI is not found");
    }
    await mongoose.connect(APP_CONFIG.MONGO_URI as string);
    console.log("Mongodb Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
