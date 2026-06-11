import * as mongoose from "mongoose";
import {getRequiredEnv} from "./env";

const mongoURI = getRequiredEnv("MONGODB_URI");

export const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI)
        console.log("MongoDB connected");
    } catch (error) {
        console.error('Could not connect to MongoDB Atlas:', error instanceof Error ? error.message : error);
        throw error;
    }
};
