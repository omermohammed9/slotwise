import mongoose from "mongoose";
import { IVerificationToken, VerificationTokenPurpose } from "../interfaces/verification-token.interface";
import verificationTokenModel from "../models/verification-token.model";

export interface VerificationTokenCreateData {
    tokenHash: string;
    purpose: VerificationTokenPurpose;
    customerId?: string;
    operatorId?: string;
    targetRole?: "owner" | "admin" | "staff";
    invitedByActorId?: string;
    businessId?: string;
    email: string;
    expiresAt: Date;
}

export interface VerificationTokenRepositoryContract {
    invalidateActiveTokens(customerId: string, purpose: VerificationTokenPurpose): Promise<void>;
    invalidateActiveOperatorTokens(operatorId: string, purpose: VerificationTokenPurpose): Promise<void>;
    invalidateActiveEmailTokens(email: string, purpose: VerificationTokenPurpose): Promise<void>;
    create(tokenData: VerificationTokenCreateData): Promise<IVerificationToken>;
    consumeActiveToken(tokenHash: string, purpose: VerificationTokenPurpose): Promise<IVerificationToken | null>;
}

export class VerificationTokenRepository implements VerificationTokenRepositoryContract {
    private static instance: VerificationTokenRepository;

    public static getInstance(): VerificationTokenRepository {
        if (!VerificationTokenRepository.instance) {
            VerificationTokenRepository.instance = new VerificationTokenRepository();
        }

        return VerificationTokenRepository.instance;
    }

    public async invalidateActiveTokens(customerId: string, purpose: VerificationTokenPurpose): Promise<void> {
        await verificationTokenModel.updateMany(
            {
                customerId: new mongoose.Types.ObjectId(customerId),
                purpose,
                consumedAt: { $exists: false },
                expiresAt: { $gt: new Date() },
            },
            {
                $set: { consumedAt: new Date() },
            },
        );
    }

    public async invalidateActiveOperatorTokens(operatorId: string, purpose: VerificationTokenPurpose): Promise<void> {
        await verificationTokenModel.updateMany(
            {
                operatorId: new mongoose.Types.ObjectId(operatorId),
                purpose,
                consumedAt: { $exists: false },
                expiresAt: { $gt: new Date() },
            },
            { $set: { consumedAt: new Date() } },
        );
    }

    public async invalidateActiveEmailTokens(email: string, purpose: VerificationTokenPurpose): Promise<void> {
        await verificationTokenModel.updateMany(
            {
                email: email.trim().toLowerCase(),
                purpose,
                consumedAt: { $exists: false },
                expiresAt: { $gt: new Date() },
            },
            { $set: { consumedAt: new Date() } },
        );
    }

    public async create(tokenData: VerificationTokenCreateData): Promise<IVerificationToken> {
        const token = new verificationTokenModel({
            ...tokenData,
            ...(tokenData.customerId ? { customerId: new mongoose.Types.ObjectId(tokenData.customerId) } : {}),
            ...(tokenData.operatorId ? { operatorId: new mongoose.Types.ObjectId(tokenData.operatorId) } : {}),
            ...(tokenData.businessId ? { businessId: new mongoose.Types.ObjectId(tokenData.businessId) } : {}),
            email: tokenData.email.trim().toLowerCase(),
        });
        await token.save();
        return token;
    }

    public async consumeActiveToken(tokenHash: string, purpose: VerificationTokenPurpose): Promise<IVerificationToken | null> {
        return verificationTokenModel.findOneAndUpdate(
            {
                tokenHash,
                purpose,
                consumedAt: { $exists: false },
                expiresAt: { $gt: new Date() },
            },
            {
                $set: { consumedAt: new Date() },
            },
            {
                returnDocument: "after",
            },
        );
    }
}
