import * as mongoose from "mongoose";
import { SlotwiseRole } from "./auth.interface";

export interface IOperatorAccount extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    actorId: string;
    username: string;
    passwordHash: string;
    role: Extract<SlotwiseRole, "owner" | "admin" | "staff">;
    active: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
