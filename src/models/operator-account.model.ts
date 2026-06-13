import mongoose from "mongoose";
import { IOperatorAccount } from "../interfaces/operator-account.interface";

const operatorAccountSchema = new mongoose.Schema<IOperatorAccount>({
    actorId: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 100 },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true, minlength: 3, maxlength: 100 },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["owner", "admin", "staff"] },
    active: { type: Boolean, required: true, default: true },
    lastLoginAt: { type: Date },
}, {
    timestamps: true,
});

operatorAccountSchema.index({ username: 1 }, { unique: true });
operatorAccountSchema.index({ actorId: 1 }, { unique: true });

const operatorAccountModel = mongoose.model<IOperatorAccount>("OperatorAccount", operatorAccountSchema);

export default operatorAccountModel;
