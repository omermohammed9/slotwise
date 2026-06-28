import mongoose from "mongoose";
import { IAuditLog } from "../interfaces/audit-log.interface";
import auditLogModel from "../models/audit-log.model";

export interface AuditLogCreateData {
    actorId: string;
    actorRole: IAuditLog["actorRole"];
    businessId?: string;
    action: string;
    targetEntity: string;
    targetId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
}

export interface AuditLogQuery {
    actorId?: string;
    action?: string;
    targetEntity?: string;
    businessId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
}

export interface AuditLogRepositoryContract {
    create(logData: AuditLogCreateData): Promise<IAuditLog>;
    find(query: AuditLogQuery): Promise<{ logs: IAuditLog[]; total: number; page: number; limit: number; totalPages: number }>;
}

export class AuditLogRepository implements AuditLogRepositoryContract {
    private static instance: AuditLogRepository;

    public static getInstance(): AuditLogRepository {
        if (!AuditLogRepository.instance) {
            AuditLogRepository.instance = new AuditLogRepository();
        }

        return AuditLogRepository.instance;
    }

    public async create(logData: AuditLogCreateData): Promise<IAuditLog> {
        const auditLog = new auditLogModel({
            ...logData,
            ...(logData.businessId ? { businessId: new mongoose.Types.ObjectId(logData.businessId) } : {}),
        });
        await auditLog.save();
        return auditLog;
    }

    public async find(query: AuditLogQuery): Promise<{ logs: IAuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
        const filters: Record<string, unknown> = {};

        if (query.actorId) filters.actorId = query.actorId;
        if (query.action) filters.action = query.action;
        if (query.targetEntity) filters.targetEntity = query.targetEntity;
        if (query.businessId) filters.businessId = new mongoose.Types.ObjectId(query.businessId);
        if (query.from || query.to) {
            filters.createdAt = {
                ...(query.from ? { $gte: query.from } : {}),
                ...(query.to ? { $lte: query.to } : {}),
            };
        }

        const page = Math.max(query.page ?? 1, 1);
        const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
        const total = await auditLogModel.countDocuments(filters);
        const logs = await auditLogModel
            .find(filters)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return {
            logs,
            total,
            page,
            limit,
            totalPages: Math.max(Math.ceil(total / limit), 1),
        };
    }
}
