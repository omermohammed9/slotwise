import { SlotwiseSession } from "../interfaces/auth.interface";
import { AuditLogQuery, AuditLogRepository, AuditLogRepositoryContract } from "../repositories/audit-log.repository";

export class AuditLogService {
    private static instance: AuditLogService;
    private readonly auditLogRepository: AuditLogRepositoryContract;

    public constructor(auditLogRepository: AuditLogRepositoryContract = AuditLogRepository.getInstance()) {
        this.auditLogRepository = auditLogRepository;
    }

    public static getInstance(): AuditLogService {
        if (!AuditLogService.instance) {
            AuditLogService.instance = new AuditLogService();
        }

        return AuditLogService.instance;
    }

    public async record(data: {
        actor?: Pick<SlotwiseSession, "actorId" | "role" | "businessId">;
        actorId?: string;
        actorRole?: SlotwiseSession["role"] | "system";
        action: string;
        targetEntity: string;
        targetId?: string;
        businessId?: string;
        requestId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        await this.auditLogRepository.create({
            actorId: data.actor?.actorId ?? data.actorId ?? "system",
            actorRole: data.actor?.role ?? data.actorRole ?? "system",
            businessId: data.businessId ?? data.actor?.businessId,
            action: data.action,
            targetEntity: data.targetEntity,
            targetId: data.targetId,
            requestId: data.requestId,
            metadata: data.metadata,
        });
    }

    public async list(actor: SlotwiseSession, query: AuditLogQuery) {
        if (!["owner", "admin"].includes(actor.role)) {
            throw new Error("Insufficient role permissions");
        }

        if (actor.role === "admin") {
            if (!actor.businessId) {
                throw new Error("Business scope is required");
            }

            return this.auditLogRepository.find({ ...query, businessId: actor.businessId });
        }

        return this.auditLogRepository.find(query);
    }

    public async exportCsv(actor: SlotwiseSession, query: AuditLogQuery): Promise<string> {
        const result = await this.list(actor, { ...query, page: 1, limit: 10_000 });
        const headers = ["createdAt", "actorRole", "actorId", "action", "targetEntity", "targetId", "businessId", "requestId", "metadata"];
        const rows = result.logs.map((log) => [
            log.createdAt?.toISOString?.() ?? "",
            log.actorRole,
            log.actorId,
            log.action,
            log.targetEntity,
            log.targetId ?? "",
            log.businessId ? String(log.businessId) : "",
            log.requestId ?? "",
            log.metadata ? JSON.stringify(log.metadata) : "",
        ]);

        return [headers, ...rows]
            .map((row) => row.map((value) => this.escapeCsv(String(value))).join(","))
            .join("\n");
    }

    private escapeCsv(value: string): string {
        if (!/[",\n\r]/.test(value)) {
            return value;
        }

        return `"${value.replace(/"/g, "\"\"")}"`;
    }
}
