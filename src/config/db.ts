import { setServers } from "dns";
import * as mongoose from "mongoose";
import { getOptionalEnv, getRequiredEnv } from "./env";

const mongoURI = getRequiredEnv("MONGODB_URI");
const mongoDnsServers = getOptionalEnv("SLOTWISE_DNS_SERVERS");

export const connectDB = async () => {
    try {
        if (mongoURI.startsWith("mongodb+srv://") && mongoDnsServers) {
            const servers = mongoDnsServers
                .split(",")
                .map((server) => server.trim())
                .filter(Boolean);

            if (servers.length > 0) {
                setServers(servers);
            }
        }

        await mongoose.connect(mongoURI)
        console.log("MongoDB connected");
    } catch (error) {
        console.error('Could not connect to MongoDB Atlas:', error instanceof Error ? error.message : error);
        throw error;
    }
};
