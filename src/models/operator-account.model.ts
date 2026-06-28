import mongoose from "mongoose";
import { IOperatorAccount } from "../interfaces/operator-account.interface";

const operatorAccountSchema = new mongoose.Schema<IOperatorAccount>({
    actorId: { type: String, required: true, trim: true, unique: true, minlength: 2, maxlength: 100 },
    username: { type: String, required: true, trim: true, lowercase: true, unique: true, minlength: 3, maxlength: 100 },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["owner", "admin", "staff"] },
    active: { type: Boolean, required: true, default: true },
    invitationAcceptedAt: { type: Date },
    invitedByActorId: { type: String, trim: true },
    failedLoginAttempts: { type: Number, required: true, default: 0, min: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
}, {
    timestamps: true,
});

operatorAccountSchema.index({ role: 1, active: 1 });
operatorAccountSchema.index({ username: 1, active: 1 });
operatorAccountSchema.index({ actorId: 1, active: 1 });

const operatorAccountModel = mongoose.model<IOperatorAccount>("OperatorAccount", operatorAccountSchema);

export default operatorAccountModel;
