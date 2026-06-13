import mongoose, { Schema } from "mongoose";
import { IAuthSession } from "../interfaces/auth-session.interface";

const authSessionSchema = new mongoose.Schema<IAuthSession>({
    sessionId: { type: String, required: true, unique: true },
    tokenHash: { type: String, required: true, unique: true },
    actorType: { type: String, required: true, enum: ["operator", "customer"] },
    actorId: { type: String, required: true },
    username: { type: String, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, required: true, enum: ["owner", "admin", "staff", "customer"] },
    businessId: { type: Schema.Types.ObjectId, ref: "BusinessProfile" },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    lastSeenAt: { type: Date },
}, {
    timestamps: true,
});

authSessionSchema.index({ sessionId: 1 }, { unique: true });
authSessionSchema.index({ tokenHash: 1 }, { unique: true });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
authSessionSchema.index({ actorType: 1, actorId: 1, revokedAt: 1 });

const authSessionModel = mongoose.model<IAuthSession>("AuthSession", authSessionSchema);

export default authSessionModel;
