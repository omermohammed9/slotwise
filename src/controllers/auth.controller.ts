import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { sendError, sendSuccess } from "../utils/apiResponse";

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
            return sendSuccess(res, 201, session);
        } catch (error) {
            const message = (error as Error).message;
            const statusCode = message === "Invalid operator credentials" ? 401 : 503;
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
            return sendSuccess(res, 201, session);
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

        return sendSuccess(res, 200, req.slotwiseSession);
    };

    public deleteSession = async (req: Request, res: Response): Promise<Response> => {
        if (!req.slotwiseSessionToken) {
            return sendError(res, 401, "Authenticated session is required");
        }

        await this.authService.revokeSession(req.slotwiseSessionToken);
        return sendSuccess(res, 200, { revoked: true });
    };
}
