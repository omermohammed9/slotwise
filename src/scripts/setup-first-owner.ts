import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { getOptionalEnv, validateRuntimeConfig } from "../config/env";
import { OperatorAccountRepository, OperatorAccountRepositoryContract } from "../repositories/operator-account.repository";
import { hashPassword } from "../utils/authCrypto";
import { createSessionId } from "../utils/authCrypto";

export const setupFirstOwner = async (
    username: string,
    password: string,
    repository: Pick<OperatorAccountRepositoryContract, "countActiveOwners" | "findAnyByUsername" | "create"> = OperatorAccountRepository.getInstance(),
): Promise<{ created: boolean; operatorId?: string }> => {
    if (!username.trim() || password.length < 8) {
        throw new Error("First owner username is required and password must be at least 8 characters");
    }

    if (await repository.countActiveOwners() > 0) {
        throw new Error("First owner setup is closed because an active owner already exists");
    }

    const existing = await repository.findAnyByUsername(username);
    if (existing) {
        throw new Error("Operator username already exists");
    }

    const owner = await repository.create({
        actorId: `owner-${createSessionId()}`,
        username: username.trim().toLowerCase(),
        passwordHash: await hashPassword(password),
        role: "owner",
        active: true,
    });

    return { created: true, operatorId: String(owner._id) };
};

const run = async () => {
    validateRuntimeConfig();

    const username = getOptionalEnv("SLOTWISE_SETUP_OWNER_USERNAME");
    const password = getOptionalEnv("SLOTWISE_SETUP_OWNER_PASSWORD");

    if (!username || !password) {
        throw new Error("Set SLOTWISE_SETUP_OWNER_USERNAME and SLOTWISE_SETUP_OWNER_PASSWORD for this one-time command");
    }

    await connectDB();
    const result = await setupFirstOwner(username, password);
    await mongoose.disconnect();
    console.log(JSON.stringify(result, null, 2));
};

if (require.main === module) {
    run().catch(async (error) => {
        console.error("First owner setup failed:", error instanceof Error ? error.message : error);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    });
}
