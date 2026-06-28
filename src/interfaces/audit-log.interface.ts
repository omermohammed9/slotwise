import * as mongoose from "mongoose";
import { SlotwiseRole } from "./auth.interface";

export interface IAuditLog extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    actorId: string;
    actorRole: SlotwiseRole;
    businessId?: mongoose.Types.ObjectId;
    action: string;
    targetEntity: string;
    targetId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
    updatedAt?: Date;
}
