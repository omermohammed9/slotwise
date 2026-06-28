import { NextFunction, Request, Response } from "express";
import { getCorsOrigins } from "../config/env";

export const allowConfiguredCors = (req: Request, res: Response, next: NextFunction): void => {
    const allowedOrigins = getCorsOrigins();
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
        res.setHeader("Access-Control-Allow-Origin", requestOrigin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-CSRF-Token");
    }

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    next();
};
