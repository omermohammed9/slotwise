import express from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuthenticatedSession } from "../middleware/requireRole";

const router = express.Router();
const authController = new AuthController();

router.post("/session", authController.createSession);
router.post("/customer/magic-link", authController.requestCustomerMagicLink);
router.post("/customer/verify", authController.verifyCustomerMagicLink);
router.get("/session", requireAuthenticatedSession, authController.getCurrentSession);
router.delete("/session", requireAuthenticatedSession, authController.deleteSession);

export default router;
