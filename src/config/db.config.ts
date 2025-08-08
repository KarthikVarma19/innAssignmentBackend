// DB connection logic

import mongoose from "mongoose";
import { config } from "../env";

export const connectDB = async () => {
  try {
    if (!config.MONGO_URI) {
      throw new Error("MONGO_URI is not found");
    }
    await mongoose.connect(config.MONGO_URI as string);
    console.log("Mongodb Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
