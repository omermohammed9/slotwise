import mongoose from "mongoose";

export interface IMigrationState extends mongoose.Document {
    migrationId: string;
    description: string;
    appliedAt: Date;
}
