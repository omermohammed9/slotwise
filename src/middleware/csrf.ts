import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";
import { getCsrfTokenFromCookieHeader, getSessionTokenFromCookieHeader } from "../utils/sessionCookie";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export const requireCsrfForCookieSession = (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!unsafeMethods.has(req.method)) {
        return next();
    }

    if (!getSessionTokenFromCookieHeader(req.header("cookie"))) {
        return next();
    }

    const cookieToken = getCsrfTokenFromCookieHeader(req.header("cookie"));
    const headerToken = req.header("x-csrf-token");

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return sendError(res, 419, "CSRF token is missing or invalid");
    }

    return next();
};
