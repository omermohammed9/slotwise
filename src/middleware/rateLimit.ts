import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

interface RateLimitBucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitOptions {
    keyPrefix: string;
    limit: number;
    windowMs: number;
    key?: (req: Request) => string;
}

const getClientIp = (req: Request): string => req.ip || req.socket.remoteAddress || "unknown";

export const createRateLimiter = (options: RateLimitOptions) => {
    return (req: Request, res: Response, next: NextFunction): void | Response => {
        const now = Date.now();
        const key = `${options.keyPrefix}:${options.key ? options.key(req) : getClientIp(req)}`;
        const existingBucket = buckets.get(key);
        const bucket = !existingBucket || existingBucket.resetAt <= now
            ? { count: 0, resetAt: now + options.windowMs }
            : existingBucket;

        bucket.count += 1;
        buckets.set(key, bucket);

        const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        res.setHeader("RateLimit-Limit", String(options.limit));
        res.setHeader("RateLimit-Remaining", String(Math.max(0, options.limit - bucket.count)));
        res.setHeader("RateLimit-Reset", String(retryAfterSeconds));

        if (bucket.count > options.limit) {
            res.setHeader("Retry-After", String(retryAfterSeconds));
            return sendError(res, 429, "Too many requests. Please try again later.");
        }

        return next();
    };
};

export const resetRateLimitBuckets = (): void => {
    buckets.clear();
};
