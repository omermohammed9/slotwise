import { Response } from "express";

export const sendSuccess = <T>(
    res: Response,
    statusCode: number,
    data: T,
    meta?: Record<string, unknown>,
): Response => {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(meta ? { meta } : {}),
    });
};

export const sendError = (res: Response, statusCode: number, message: string): Response => {
    return res.status(statusCode).json({
        success: false,
        error: {
            message,
        },
    });
};
