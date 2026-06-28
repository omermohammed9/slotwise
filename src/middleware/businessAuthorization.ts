import { NextFunction, Request, RequestHandler, Response } from "express";
import { sendError } from "../utils/apiResponse";

const getStringValue = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim()) {
        return value.trim();
    }

    return null;
};

export const getRequestedBusinessId = (req: Request): string | null => (
    getStringValue(req.params.businessId)
    ?? getStringValue(req.params.id)
    ?? getStringValue(req.body?.businessId)
    ?? getStringValue(req.query.businessId)
);

export const requireBusinessScopeAccess = (req: Request, res: Response, next: NextFunction): Response | void => {
    const session = req.slotwiseSession;

    if (!session) {
        return sendError(res, 401, "Authenticated session is required");
    }

    if (session.role === "owner") {
        return next();
    }

    const requestedBusinessId = getRequestedBusinessId(req);
    if (!requestedBusinessId) {
        return sendError(res, 403, "Business scope is required");
    }

    if (!session.businessId || session.businessId !== requestedBusinessId) {
        return sendError(res, 403, "Business access is denied");
    }

    return next();
};

export const requireResolvedBusinessScopeAccess = (
    resolveBusinessId: (req: Request) => Promise<string | null>,
): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        const session = req.slotwiseSession;

        if (!session) {
            return sendError(res, 401, "Authenticated session is required");
        }

        if (session.role === "owner") {
            return next();
        }

        let resolvedBusinessId: string | null;
        try {
            resolvedBusinessId = await resolveBusinessId(req);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }

        if (!resolvedBusinessId) {
            return sendError(res, 404, "Business-scoped resource not found");
        }

        if (!session.businessId || session.businessId !== resolvedBusinessId) {
            return sendError(res, 403, "Business access is denied");
        }

        const requestedBusinessId = getRequestedBusinessId(req);
        if (requestedBusinessId && requestedBusinessId !== resolvedBusinessId) {
            return sendError(res, 403, "Business access is denied");
        }

        return next();
    };
};
