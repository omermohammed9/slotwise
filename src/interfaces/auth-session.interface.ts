import * as mongoose from "mongoose";
import { SlotwiseActorType, SlotwiseRole } from "./auth.interface";

export interface IAuthSession extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    sessionId: string;
    tokenHash: string;
    actorType: SlotwiseActorType;
    actorId: string;
    username?: string;
    email?: string;
    role: Extract<SlotwiseRole, "owner" | "admin" | "staff" | "customer">;
    businessId?: mongoose.Types.ObjectId;
    expiresAt: Date;
    revokedAt?: Date;
    lastSeenAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
