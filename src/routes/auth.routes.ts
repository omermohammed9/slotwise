import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuthenticatedSession } from "../middleware/requireRole";
import { createRateLimiter } from "../middleware/rateLimit";

const router = express.Router();
const authController = new AuthController();

router.post("/session", createRateLimiter({
    keyPrefix: "operator-login",
    limit: 10,
    windowMs: 15 * 60_000,
    key: (req) => `${req.ip}:${String(req.body?.username ?? "").trim().toLowerCase()}`,
}), authController.createSession);
router.get("/operators", requireAuthenticatedSession, authController.listOperators);
router.post("/operators/invitations", requireAuthenticatedSession, authController.inviteOperator);
router.post("/operators/invitations/accept", authController.acceptOperatorInvitation);
router.post("/operators/password-reset", authController.requestOperatorPasswordReset);
router.post("/operators/password-reset/complete", authController.completeOperatorPasswordReset);
router.patch("/operators/:operatorId/role", requireAuthenticatedSession, authController.updateOperatorRole);
router.patch("/operators/:operatorId/status", requireAuthenticatedSession, authController.updateOperatorStatus);
router.post("/customer/magic-link", createRateLimiter({
    keyPrefix: "customer-magic-link",
    limit: 5,
    windowMs: 15 * 60_000,
    key: (req) => `${req.ip}:${String(req.body?.businessId ?? "")}:${String(req.body?.email ?? "").trim().toLowerCase()}`,
}), authController.requestCustomerMagicLink);
router.post("/customer/verify", createRateLimiter({
    keyPrefix: "customer-verify",
    limit: 10,
    windowMs: 15 * 60_000,
}), authController.verifyCustomerMagicLink);
router.get("/session", requireAuthenticatedSession, authController.getCurrentSession);
router.delete("/session", requireAuthenticatedSession, authController.deleteSession);

export default router;
