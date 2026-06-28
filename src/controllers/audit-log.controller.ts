import { Request, Response } from "express";
import { AuditLogService } from "../services/audit-log.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

export class AuditLogController {
    private readonly auditLogService: AuditLogService;

    public constructor(auditLogService: AuditLogService = AuditLogService.getInstance()) {
        this.auditLogService = auditLogService;
    }

    public listAuditLogs = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) {
            return sendError(res, 401, "Authenticated session is required");
        }

        try {
            const result = await this.auditLogService.list(req.slotwiseSession, this.toAuditQuery(req));

            return sendSuccess(res, 200, { logs: result.logs }, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message === "Insufficient role permissions" ? 403 : 400, message);
        }
    };

    public exportAuditLogs = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) {
            return sendError(res, 401, "Authenticated session is required");
        }

        try {
            const csv = await this.auditLogService.exportCsv(req.slotwiseSession, this.toAuditQuery(req));
            res.setHeader("Content-Type", "text/csv; charset=utf-8");
            res.setHeader("Content-Disposition", `attachment; filename="slotwise-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`);
            return res.status(200).send(csv);
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message === "Insufficient role permissions" ? 403 : 400, message);
        }
    };

    private toAuditQuery(req: Request) {
        return {
            actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
            action: typeof req.query.action === "string" ? req.query.action : undefined,
            targetEntity: typeof req.query.entity === "string" ? req.query.entity : undefined,
            from: typeof req.query.from === "string" ? new Date(req.query.from) : undefined,
            to: typeof req.query.to === "string" ? new Date(req.query.to) : undefined,
            page: typeof req.query.page === "string" ? Number(req.query.page) : undefined,
            limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
        };
    }
}
