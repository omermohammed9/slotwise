import mongoose from "mongoose";
import { IMigrationState } from "../interfaces/migration-state.interface";

const migrationStateSchema = new mongoose.Schema<IMigrationState>({
    migrationId: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    appliedAt: { type: Date, required: true },
}, {
    timestamps: true,
});

migrationStateSchema.index({ appliedAt: -1 });

const migrationStateModel = mongoose.model<IMigrationState>("MigrationState", migrationStateSchema);

export default migrationStateModel;
