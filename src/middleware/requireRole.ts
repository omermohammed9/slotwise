import { NextFunction, Request, RequestHandler, Response } from "express";
import { SlotwiseRole } from "../interfaces/auth.interface";
import { AuthService } from "../services/auth.service";
import { sendError } from "../utils/apiResponse";

const extractBearerToken = (authorizationHeader: string | undefined): string | null => {
    if (!authorizationHeader) {
        return null;
    }

    const [scheme, token] = authorizationHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        return null;
    }

    return token;
};

export const requireAuthenticatedSession: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const token = extractBearerToken(req.header("authorization"));

    if (!token) {
        return sendError(res, 401, "Bearer session token is required");
    }

    let session;
    try {
        session = await AuthService.getInstance().getSession(token);
    } catch (error) {
        return sendError(res, 503, (error as Error).message);
    }

    if (!session) {
        return sendError(res, 401, "Session is invalid or expired");
    }

    req.slotwiseSession = session;
    req.slotwiseSessionToken = token;
    next();
};

export const requireRole = (allowedRoles: SlotwiseRole[]): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        return requireAuthenticatedSession(req, res, () => {
            const role = req.slotwiseSession?.role;

            if (!role) {
                return sendError(res, 401, "Authenticated session is required");
            }

            if (!allowedRoles.includes(role)) {
                return sendError(res, 403, "Insufficient role permissions");
            }

            next();
        });
    };
};
