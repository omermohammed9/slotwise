import { IOperatorAccount } from "../interfaces/operator-account.interface";
import operatorAccountModel from "../models/operator-account.model";

export interface BootstrapOperatorAccountData {
    actorId: string;
    username: string;
    passwordHash: string;
    role: IOperatorAccount["role"];
}

export interface OperatorAccountRepositoryContract {
    findByUsername(username: string): Promise<IOperatorAccount | null>;
    upsertBootstrapAccount(accountData: BootstrapOperatorAccountData): Promise<void>;
    updateLastLogin(id: string): Promise<void>;
    getActiveRoles(): Promise<IOperatorAccount["role"][]>;
}

export class OperatorAccountRepository implements OperatorAccountRepositoryContract {
    private static instance: OperatorAccountRepository;

    public static getInstance(): OperatorAccountRepository {
        if (!OperatorAccountRepository.instance) {
            OperatorAccountRepository.instance = new OperatorAccountRepository();
        }

        return OperatorAccountRepository.instance;
    }

    public async findByUsername(username: string): Promise<IOperatorAccount | null> {
        return operatorAccountModel.findOne({
            username: username.trim().toLowerCase(),
            active: true,
        });
    }

    public async upsertBootstrapAccount(accountData: BootstrapOperatorAccountData): Promise<void> {
        await operatorAccountModel.updateOne(
            { username: accountData.username },
            {
                $setOnInsert: {
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
            $set: { lastLoginAt: new Date() },
        });
    }

    public async getActiveRoles(): Promise<IOperatorAccount["role"][]> {
        const accounts = await operatorAccountModel.find({ active: true }).select("role");
        return [...new Set(accounts.map((account) => account.role))];
    }
}
