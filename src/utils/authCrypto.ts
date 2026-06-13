import { argon2, createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { getOptionalEnv } from "../config/env";

const argon2TagLength = 32;
const argon2Parameters = {
    parallelism: 1,
    tagLength: argon2TagLength,
    memory: 19456,
    passes: 2,
};
const hashFormatVersion = "v1";
const hashFormatPrefix = "argon2id";
const authAssociatedData = Buffer.from("slotwise-auth");

const deriveArgon2Key = async (message: string, nonce: Buffer): Promise<Buffer> => {
    const pepper = getOptionalEnv("SLOTWISE_AUTH_PEPPER");

    return new Promise((resolve, reject) => {
        argon2("argon2id", {
            message,
            nonce,
            ...argon2Parameters,
            ...(pepper ? { secret: Buffer.from(pepper, "utf8") } : {}),
            associatedData: authAssociatedData,
        }, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(derivedKey);
        });
    });
};

export const hashPassword = async (password: string): Promise<string> => {
    const nonce = randomBytes(16);
    const derivedKey = await deriveArgon2Key(password, nonce);
    return `${hashFormatPrefix}$${hashFormatVersion}$${nonce.toString("hex")}$${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
    const [algorithm, version, nonceHex, derivedKeyHex] = storedHash.split("$");

    if (algorithm !== hashFormatPrefix || version !== hashFormatVersion || !nonceHex || !derivedKeyHex) {
        return false;
    }

    const nonce = Buffer.from(nonceHex, "hex");
    const expectedDerivedKey = Buffer.from(derivedKeyHex, "hex");
    const receivedDerivedKey = await deriveArgon2Key(password, nonce);

    if (receivedDerivedKey.length !== expectedDerivedKey.length) {
        return false;
    }

    return timingSafeEqual(receivedDerivedKey, expectedDerivedKey);
};

export const createOpaqueSessionToken = (): string => randomBytes(32).toString("hex");

export const createSessionId = (): string => randomUUID();

export const hashOpaqueToken = (token: string): string => createHash("sha256").update(token).digest("hex");
