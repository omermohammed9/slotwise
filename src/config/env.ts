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

export type SlotwiseRuntimeEnv = "local" | "staging" | "production" | "test";

export const getRuntimeEnv = (): SlotwiseRuntimeEnv => {
    const value = getOptionalEnv("SLOTWISE_ENV") ?? getOptionalEnv("NODE_ENV") ?? "local";

    if (value === "development") {
        return "local";
    }

    if (!["local", "staging", "production", "test"].includes(value)) {
        throw new Error("SLOTWISE_ENV must be local, staging, production, or test");
    }

    return value as SlotwiseRuntimeEnv;
};

export const isProductionRuntime = (): boolean => getRuntimeEnv() === "production";
export const isLocalOrTestRuntime = (): boolean => ["local", "test"].includes(getRuntimeEnv());

export const getCorsOrigins = (): string[] => {
    const configuredOrigins = getOptionalEnv("SLOTWISE_CORS_ORIGINS");

    if (!configuredOrigins) {
        if (isProductionRuntime()) {
            throw new Error("SLOTWISE_CORS_ORIGINS is required in production");
        }

        return ["http://localhost:5173", "http://127.0.0.1:5173"];
    }

    const origins = configuredOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        throw new Error("SLOTWISE_CORS_ORIGINS must include at least one origin");
    }

    if (isProductionRuntime() && origins.some((origin) => origin === "*" || origin.startsWith("http://"))) {
        throw new Error("Production CORS origins must be explicit HTTPS origins");
    }

    return origins;
};

export const getSessionCookieName = (): string => getOptionalEnv("SLOTWISE_SESSION_COOKIE_NAME") ?? "slotwise_session";

export const getCsrfCookieName = (): string => getOptionalEnv("SLOTWISE_CSRF_COOKIE_NAME") ?? "slotwise_csrf";

export const isSessionCookieSecure = (): boolean => isProductionRuntime() || getOptionalEnv("SLOTWISE_SESSION_COOKIE_SECURE") === "true";

export const getTrustedProxySetting = (): boolean | number | string => {
    const configuredProxy = getOptionalEnv("SLOTWISE_TRUST_PROXY");

    if (!configuredProxy) {
        return isProductionRuntime() ? 1 : false;
    }

    if (configuredProxy === "true") {
        return true;
    }

    if (configuredProxy === "false") {
        return false;
    }

    const proxyHopCount = Number(configuredProxy);
    return Number.isInteger(proxyHopCount) && proxyHopCount >= 0 ? proxyHopCount : configuredProxy;
};

export const validateRuntimeConfig = (): void => {
    const runtimeEnv = getRuntimeEnv();
    const required = ["MONGODB_URI"];

    if (runtimeEnv === "production" || runtimeEnv === "staging") {
        required.push("SLOTWISE_AUTH_PEPPER", "SLOTWISE_CORS_ORIGINS");
    }

    required.forEach(getRequiredEnv);
    getCorsOrigins();

    if (runtimeEnv === "production") {
        if (!getRequiredEnv("MONGODB_URI").startsWith("mongodb+srv://") && !getRequiredEnv("MONGODB_URI").startsWith("mongodb://")) {
            throw new Error("MONGODB_URI must be a MongoDB connection string");
        }

        if (getOptionalEnv("SLOTWISE_SESSION_COOKIE_SECURE") === "false") {
            throw new Error("SLOTWISE_SESSION_COOKIE_SECURE cannot be false in production");
        }

        ["OWNER", "ADMIN", "STAFF"].forEach((role) => {
            if (getOptionalEnv(`SLOTWISE_${role}_USERNAME`) || getOptionalEnv(`SLOTWISE_${role}_PASSWORD`)) {
                throw new Error(`SLOTWISE_${role}_* bootstrap credentials are not allowed in production`);
            }
        });
    }
};

export const validateNotificationWorkerConfig = (): void => {
    validateRuntimeConfig();

    const provider = getOptionalEnv("SLOTWISE_EMAIL_PROVIDER") ?? "noop";
    if (!["noop", "resend"].includes(provider)) {
        throw new Error("SLOTWISE_EMAIL_PROVIDER must be noop or resend");
    }

    if (provider === "resend") {
        getRequiredEnv("RESEND_API_KEY");
        getRequiredEnv("SLOTWISE_EMAIL_FROM");
    }
};
