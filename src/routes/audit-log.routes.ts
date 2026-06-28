import express from "express";
import { AuditLogController } from "../controllers/audit-log.controller";
import { requireRole } from "../middleware/requireRole";

const router = express.Router();
const auditLogController = new AuditLogController();

router.get("/export", requireRole(["owner", "admin"]), auditLogController.exportAuditLogs);
router.get("/", requireRole(["owner", "admin"]), auditLogController.listAuditLogs);

export default router;
