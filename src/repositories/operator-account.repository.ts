import { IOperatorAccount } from "../interfaces/operator-account.interface";
import operatorAccountModel from "../models/operator-account.model";

export interface BootstrapOperatorAccountData {
    actorId: string;
    username: string;
    passwordHash: string;
    role: IOperatorAccount["role"];
}

export interface OperatorAccountRepositoryContract {
    create(accountData: BootstrapOperatorAccountData & { active?: boolean; invitedByActorId?: string }): Promise<IOperatorAccount>;
    findById(id: string): Promise<IOperatorAccount | null>;
    findByUsername(username: string): Promise<IOperatorAccount | null>;
    findAnyByUsername(username: string): Promise<IOperatorAccount | null>;
    list(): Promise<IOperatorAccount[]>;
    upsertBootstrapAccount(accountData: BootstrapOperatorAccountData): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    recordFailedLogin(id: string, failedLoginAttempts: number, lockedUntil?: Date): Promise<void>;
    resetFailedLogins(id: string): Promise<void>;
    getActiveRoles(): Promise<IOperatorAccount["role"][]>;
    countActiveOwners(): Promise<number>;
    acceptInvitation(id: string, passwordHash: string): Promise<IOperatorAccount | null>;
    updateRole(id: string, role: IOperatorAccount["role"]): Promise<IOperatorAccount | null>;
    updateActive(id: string, active: boolean): Promise<IOperatorAccount | null>;
}

export class OperatorAccountRepository implements OperatorAccountRepositoryContract {
    private static instance: OperatorAccountRepository;

    public static getInstance(): OperatorAccountRepository {
        if (!OperatorAccountRepository.instance) {
            OperatorAccountRepository.instance = new OperatorAccountRepository();
        }

        return OperatorAccountRepository.instance;
    }

    public async create(accountData: BootstrapOperatorAccountData & { active?: boolean; invitedByActorId?: string }): Promise<IOperatorAccount> {
        const account = new operatorAccountModel({
            ...accountData,
            active: accountData.active ?? false,
            invitedByActorId: accountData.invitedByActorId,
        });
        await account.save();
        return account;
    }

    public async findById(id: string): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findById(id);
    }

    public async findByUsername(username: string): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findOne({
            username: username.trim().toLowerCase(),
            active: true,
        });
    }

    public async findAnyByUsername(username: string): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findOne({ username: username.trim().toLowerCase() });
    }

    public async list(): Promise<IOperatorAccount[]> {
        return operatorAccountModel.find().sort({ role: 1, username: 1 });
    }

    public async upsertBootstrapAccount(accountData: BootstrapOperatorAccountData): Promise<void> {
        await operatorAccountModel.updateOne(
            { username: accountData.username },
            {
                $set: {
                    actorId: accountData.actorId,
                    username: accountData.username,
                    passwordHash: accountData.passwordHash,
                    role: accountData.role,
                    active: true,
                },
            },
            { upsert: true },
        );
    }

    public async updateLastLogin(id: string): Promise<void> {
        await operatorAccountModel.findByIdAndUpdate(id, {
            $set: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
            $unset: { lockedUntil: "" },
        });
    }

    public async recordFailedLogin(id: string, failedLoginAttempts: number, lockedUntil?: Date): Promise<void> {
        await operatorAccountModel.findByIdAndUpdate(id, {
            $set: {
                failedLoginAttempts,
                ...(lockedUntil ? { lockedUntil } : {}),
            },
        });
    }

    public async resetFailedLogins(id: string): Promise<void> {
        await operatorAccountModel.findByIdAndUpdate(id, {
            $set: { failedLoginAttempts: 0 },
            $unset: { lockedUntil: "" },
        });
    }

    public async getActiveRoles(): Promise<IOperatorAccount["role"][]> {
        const accounts = await operatorAccountModel.find({ active: true }).select("role");
        return [...new Set(accounts.map((account) => account.role))];
    }

    public async countActiveOwners(): Promise<number> {
        return operatorAccountModel.countDocuments({ role: "owner", active: true });
    }

    public async acceptInvitation(id: string, passwordHash: string): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    passwordHash,
                    active: true,
                    invitationAcceptedAt: new Date(),
                    failedLoginAttempts: 0,
                },
                $unset: { lockedUntil: "" },
            },
            { returnDocument: "after" },
        );
    }

    public async updateRole(id: string, role: IOperatorAccount["role"]): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findByIdAndUpdate(id, { $set: { role } }, { returnDocument: "after" });
    }

    public async updateActive(id: string, active: boolean): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findByIdAndUpdate(id, { $set: { active } }, { returnDocument: "after" });
    }
}
