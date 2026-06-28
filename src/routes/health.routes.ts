import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/health", (_req, res) => {
    res.json({ success: true, status: "ok" });
});

router.get("/ready", (_req, res) => {
    const connected = mongoose.connection.readyState === 1;

    res.status(connected ? 200 : 503).json({
        success: connected,
        status: connected ? "ready" : "not_ready",
        checks: {
            database: connected ? "ok" : "unavailable",
        },
    });
});

export default router;
