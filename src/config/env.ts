import { config } from "dotenv";

process.env.DOTENV_CONFIG_QUIET ??= "true";

config({ quiet: true });

// Backward-compatible fallback for the current project layout. Prefer a root
// `.env` going forward so config is not stored inside `src/`.
config({ path: "./src/.env", override: false, quiet: true });

export const getRequiredEnv = (name: string): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

export const getOptionalEnv = (name: string): string | undefined => {
    const value = process.env[name];
    return value && value.trim() ? value : undefined;
};

export const getPort = (): string => process.env.PORT || "3000";
