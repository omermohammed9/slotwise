import mongoose, { Schema } from "mongoose";
import { IAuditLog } from "../interfaces/audit-log.interface";

const auditLogSchema = new mongoose.Schema<IAuditLog>({
    actorId: { type: String, required: true, trim: true, index: true },
    actorRole: { type: String, required: true, enum: ["owner", "admin", "staff", "customer", "system"], index: true },
    businessId: { type: Schema.Types.ObjectId, ref: "BusinessProfile", index: true },
    action: { type: String, required: true, trim: true, index: true },
    targetEntity: { type: String, required: true, trim: true, index: true },
    targetId: { type: String, trim: true },
    requestId: { type: String, trim: true, index: true },
    metadata: { type: Schema.Types.Mixed },
}, {
    timestamps: true,
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetEntity: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, action: 1, createdAt: -1 });

const auditLogModel = mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default auditLogModel;
