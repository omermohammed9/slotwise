import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { sendError, sendSuccess } from "../utils/apiResponse";
import { clearCsrfCookie, clearSessionCookie, createCsrfToken, setCsrfCookie, setSessionCookie } from "../utils/sessionCookie";

export class AuthController {
    private readonly authService: AuthService;

    public constructor(authService: AuthService = AuthService.getInstance()) {
        this.authService = authService;
    }

    public createSession = async (req: Request, res: Response): Promise<Response> => {
        const { username, password } = req.body as { username?: string; password?: string };

        if (!username || !password) {
            return sendError(res, 400, "Username and password are required");
        }

        try {
            const session = await this.authService.createSession(username, password);
            setSessionCookie(res, session.token, session.expiresAt);
            const csrfToken = createCsrfToken();
            setCsrfCookie(res, csrfToken, session.expiresAt);
            return sendSuccess(res, 201, { ...session, csrfToken });
        } catch (error) {
            const message = (error as Error).message;
            const statusCode = message === "Invalid operator credentials"
                ? 401
                : message === "Operator account is temporarily locked"
                    ? 423
                    : 503;
            return sendError(res, statusCode, message);
        }
    };

    public requestCustomerMagicLink = async (req: Request, res: Response): Promise<Response> => {
        const { businessId, email } = req.body as { businessId?: string; email?: string };

        if (!businessId || !email) {
            return sendError(res, 400, "businessId and email are required");
        }

        try {
            const result = await this.authService.requestCustomerMagicLink(businessId, email);
            return sendSuccess(res, 202, result);
        } catch (error) {
            return sendError(res, 400, (error as Error).message);
        }
    };

    public verifyCustomerMagicLink = async (req: Request, res: Response): Promise<Response> => {
        const { token } = req.body as { token?: string };

        if (!token) {
            return sendError(res, 400, "token is required");
        }

        try {
            const session = await this.authService.verifyCustomerMagicLink(token);
            setSessionCookie(res, session.token, session.expiresAt);
            const csrfToken = createCsrfToken();
            setCsrfCookie(res, csrfToken, session.expiresAt);
            return sendSuccess(res, 201, { ...session, csrfToken });
        } catch (error) {
            const message = (error as Error).message;
            const statusCode = message === "Invalid or expired customer verification token" ? 401 : 400;
            return sendError(res, statusCode, message);
        }
    };

    public getCurrentSession = (req: Request, res: Response): Response => {
        if (!req.slotwiseSession) {
            return sendError(res, 401, "Authenticated session is required");
        }

        const csrfToken = createCsrfToken();
        setCsrfCookie(res, csrfToken, req.slotwiseSession.expiresAt);
        return sendSuccess(res, 200, { ...req.slotwiseSession, csrfToken });
    };

    public deleteSession = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSessionToken) {
            return sendError(res, 401, "Authenticated session is required");
        }

        await this.authService.revokeSession(req.slotwiseSessionToken);
        clearSessionCookie(res);
        clearCsrfCookie(res);
        return sendSuccess(res, 200, { revoked: true });
    };

    public listOperators = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) return sendError(res, 401, "Authenticated session is required");

        try {
            const operators = await this.authService.listOperatorAccounts(req.slotwiseSession);
            return sendSuccess(res, 200, { operators });
        } catch (error) {
            return sendError(res, 403, (error as Error).message);
        }
    };

    public inviteOperator = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) return sendError(res, 401, "Authenticated session is required");
        const { username, role } = req.body as { username?: string; role?: "owner" | "admin" | "staff" };

        if (!username || !role) return sendError(res, 400, "username and role are required");

        try {
            return sendSuccess(res, 201, await this.authService.inviteOperator(req.slotwiseSession, username, role));
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message === "Owner role is required" ? 403 : 400, message);
        }
    };

    public acceptOperatorInvitation = async (req: Request, res: Response): Promise<Response> => {
        const { token, password } = req.body as { token?: string; password?: string };
        if (!token || !password) return sendError(res, 400, "token and password are required");

        try {
            return sendSuccess(res, 200, await this.authService.acceptOperatorInvitation(token, password));
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message.includes("Invalid or expired") ? 401 : 400, message);
        }
    };

    public requestOperatorPasswordReset = async (req: Request, res: Response): Promise<Response> => {
        const { username } = req.body as { username?: string };
        if (!username) return sendError(res, 400, "username is required");

        return sendSuccess(res, 202, await this.authService.requestOperatorPasswordReset(username));
    };

    public completeOperatorPasswordReset = async (req: Request, res: Response): Promise<Response> => {
        const { token, password } = req.body as { token?: string; password?: string };
        if (!token || !password) return sendError(res, 400, "token and password are required");

        try {
            return sendSuccess(res, 200, await this.authService.completeOperatorPasswordReset(token, password));
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message.includes("Invalid or expired") ? 401 : 400, message);
        }
    };

    public updateOperatorRole = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) return sendError(res, 401, "Authenticated session is required");
        const { role } = req.body as { role?: "owner" | "admin" | "staff" };
        if (!role) return sendError(res, 400, "role is required");
        const operatorId = Array.isArray(req.params.operatorId) ? req.params.operatorId[0] : req.params.operatorId;
        if (!operatorId) return sendError(res, 400, "operatorId is required");

        try {
            return sendSuccess(res, 200, await this.authService.updateOperatorRole(req.slotwiseSession, operatorId, role));
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message === "Owner role is required" ? 403 : 400, message);
        }
    };

    public updateOperatorStatus = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSession) return sendError(res, 401, "Authenticated session is required");
        const { active } = req.body as { active?: boolean };
        if (typeof active !== "boolean") return sendError(res, 400, "active is required");
        const operatorId = Array.isArray(req.params.operatorId) ? req.params.operatorId[0] : req.params.operatorId;
        if (!operatorId) return sendError(res, 400, "operatorId is required");

        try {
            return sendSuccess(res, 200, await this.authService.updateOperatorStatus(req.slotwiseSession, operatorId, active));
        } catch (error) {
            const message = (error as Error).message;
            return sendError(res, message === "Owner role is required" ? 403 : 400, message);
        }
    };
}
