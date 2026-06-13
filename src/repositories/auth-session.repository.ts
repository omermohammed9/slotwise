import { IAuthSession } from "../interfaces/auth-session.interface";
import authSessionModel from "../models/auth-session.model";

export interface AuthSessionCreateData {
    sessionId: string;
    tokenHash: string;
    actorType: IAuthSession["actorType"];
    actorId: string;
    username?: string;
    email?: string;
    role: IAuthSession["role"];
    businessId?: string;
    expiresAt: Date;
}

export interface AuthSessionRepositoryContract {
    create(sessionData: AuthSessionCreateData): Promise<IAuthSession>;
    findActiveByTokenHash(tokenHash: string): Promise<IAuthSession | null>;
    revokeByTokenHash(tokenHash: string): Promise<boolean>;
    touch(sessionId: string): Promise<void>;
}

export class AuthSessionRepository implements AuthSessionRepositoryContract {
    private static instance: AuthSessionRepository;

    public static getInstance(): AuthSessionRepository {
        if (!AuthSessionRepository.instance) {
            AuthSessionRepository.instance = new AuthSessionRepository();
        }

        return AuthSessionRepository.instance;
    }

    public async create(sessionData: AuthSessionCreateData): Promise<IAuthSession> {
        const session = new authSessionModel(sessionData);
        await session.save();
        return session;
    }

    public async findActiveByTokenHash(tokenHash: string): Promise<IAuthSession | null> {
        return authSessionModel.findOne({
            tokenHash,
            revokedAt: { $exists: false },
            expiresAt: { $gt: new Date() },
        });
    }

    public async revokeByTokenHash(tokenHash: string): Promise<boolean> {
        const result = await authSessionModel.updateOne(
            {
                tokenHash,
                revokedAt: { $exists: false },
            },
            {
                $set: { revokedAt: new Date() },
            },
        );

        return result.modifiedCount > 0;
    }

    public async touch(sessionId: string): Promise<void> {
        await authSessionModel.updateOne(
            { sessionId, revokedAt: { $exists: false } },
            { $set: { lastSeenAt: new Date() } },
        );
    }
}
