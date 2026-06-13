import * as mongoose from "mongoose";

export type VerificationTokenPurpose = "customer_magic_link";

export interface IVerificationToken extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    tokenHash: string;
    purpose: VerificationTokenPurpose;
    customerId: mongoose.Types.ObjectId;
    businessId?: mongoose.Types.ObjectId;
    email: string;
    expiresAt: Date;
    consumedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
