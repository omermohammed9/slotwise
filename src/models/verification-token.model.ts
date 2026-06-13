import mongoose, { Schema } from "mongoose";
import { IVerificationToken } from "../interfaces/verification-token.interface";

const removeSensitiveVerificationFields = (_document: unknown, returnedObject: Record<string, unknown>) => {
    delete returnedObject.tokenHash;
    return returnedObject;
};

const verificationTokenSchema = new mongoose.Schema<IVerificationToken>({
    tokenHash: { type: String, required: true, unique: true },
    purpose: { type: String, required: true, enum: ["customer_magic_link"] },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    businessId: { type: Schema.Types.ObjectId, ref: "BusinessProfile" },
    email: { type: String, required: true, trim: true, lowercase: true },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { transform: removeSensitiveVerificationFields },
    toObject: { transform: removeSensitiveVerificationFields },
});

verificationTokenSchema.index({ tokenHash: 1 }, { unique: true });
verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
verificationTokenSchema.index({ customerId: 1, purpose: 1, consumedAt: 1 });

const verificationTokenModel = mongoose.model<IVerificationToken>("VerificationToken", verificationTokenSchema);

export default verificationTokenModel;
