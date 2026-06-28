import * as mongoose from "mongoose";

export type VerificationTokenPurpose = "customer_magic_link" | "operator_invitation" | "operator_password_reset";

export interface IVerificationToken extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    tokenHash: string;
    purpose: VerificationTokenPurpose;
    customerId?: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    targetRole?: "owner" | "admin" | "staff";
    invitedByActorId?: string;
    businessId?: mongoose.Types.ObjectId;
    email: string;
    expiresAt: Date;
    consumedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
