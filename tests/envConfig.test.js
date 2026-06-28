const test = require("node:test");
const assert = require("node:assert/strict");

const env = require("../dist/config/env");

const withEnv = (values, callback) => {
    const original = { ...process.env };
    Object.keys(process.env).forEach((key) => {
        if (key.startsWith("SLOTWISE_") || key === "MONGODB_URI" || key === "NODE_ENV" || key === "RESEND_API_KEY") {
            delete process.env[key];
        }
    });
    Object.assign(process.env, values);

    try {
        callback();
    } finally {
        process.env = original;
    }
};

test("local runtime provides localhost CORS defaults", () => {
    withEnv({ SLOTWISE_ENV: "local", MONGODB_URI: "mongodb://localhost:27017/slotwise" }, () => {
        assert.deepEqual(env.getCorsOrigins(), ["http://localhost:5173", "http://127.0.0.1:5173"]);
    });
});

test("production runtime rejects insecure CORS origins", () => {
    withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise",
        SLOTWISE_AUTH_PEPPER: "pepper",
        SLOTWISE_CORS_ORIGINS: "http://example.com",
        SLOTWISE_ENV: "production",
    }, () => {
        assert.throws(() => env.validateRuntimeConfig(), /Production CORS origins must be explicit HTTPS origins/);
    });
});

test("production runtime rejects explicitly insecure cookies", () => {
    withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise",
        SLOTWISE_AUTH_PEPPER: "pepper",
        SLOTWISE_CORS_ORIGINS: "https://app.example.com",
        SLOTWISE_ENV: "production",
        SLOTWISE_SESSION_COOKIE_SECURE: "false",
    }, () => {
        assert.throws(() => env.validateRuntimeConfig(), /SLOTWISE_SESSION_COOKIE_SECURE cannot be false/);
    });
});

test("production runtime does not require bootstrap operator credentials", () => {
    withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise",
        SLOTWISE_AUTH_PEPPER: "pepper",
        SLOTWISE_CORS_ORIGINS: "https://app.example.com",
        SLOTWISE_ENV: "production",
    }, () => {
        assert.doesNotThrow(() => env.validateRuntimeConfig());
    });
});

test("production runtime rejects env bootstrap operator credentials", () => {
    withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise",
        SLOTWISE_AUTH_PEPPER: "pepper",
        SLOTWISE_CORS_ORIGINS: "https://app.example.com",
        SLOTWISE_ENV: "production",
        SLOTWISE_OWNER_USERNAME: "owner@example.com",
        SLOTWISE_OWNER_PASSWORD: "unsafe",
    }, () => {
        assert.throws(() => env.validateRuntimeConfig(), /bootstrap credentials are not allowed in production/);
    });
});

test("resend worker config requires provider credentials", () => {
    withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise",
        SLOTWISE_ENV: "local",
        SLOTWISE_EMAIL_PROVIDER: "resend",
    }, () => {
        assert.throws(() => env.validateNotificationWorkerConfig(), /RESEND_API_KEY|SLOTWISE_EMAIL_FROM/);
    });
});
