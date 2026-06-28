import { randomUUID } from "crypto";
import { ErrorRequestHandler, RequestHandler } from "express";
import { log } from "../utils/logger";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
    const incomingRequestId = req.header("x-request-id");
    const requestId = incomingRequestId && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim().slice(0, 128)
        : randomUUID();

    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    next();
};

export const requestLogMiddleware: RequestHandler = (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        log("info", "http_request", {
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Math.round(durationMs),
            actorId: req.slotwiseSession?.actorId,
            role: req.slotwiseSession?.role,
            businessId: req.slotwiseSession?.businessId ?? req.params.businessId ?? req.body?.businessId,
        });
    });

    next();
};

export const notFoundMiddleware: RequestHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            message: "Route not found",
            requestId: req.requestId,
        },
    });
};

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
    log("error", "unexpected_request_error", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        actorId: req.slotwiseSession?.actorId,
        role: req.slotwiseSession?.role,
        businessId: req.slotwiseSession?.businessId,
        error,
    });

    res.status(500).json({
        success: false,
        error: {
            message: "Internal server error",
            requestId: req.requestId,
        },
    });
};
