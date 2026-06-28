const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const withEnv = async (values, callback) => {
    const original = { ...process.env };
    Object.assign(process.env, values);

    try {
        await callback();
    } finally {
        process.env = original;
    }
};

const listen = (app) => new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, () => resolve(server));
});

test("API returns request IDs and health status without starting external workers", async () => {
    await withEnv({ SLOTWISE_ENV: "test", MONGODB_URI: "mongodb://localhost:27017/slotwise-test" }, async () => {
        const { createApp } = require("../dist/app");
        const server = await listen(createApp());
        const { port } = server.address();

        try {
            const response = await fetch(`http://127.0.0.1:${port}/health`, {
                headers: { "x-request-id": "test-request-id" },
            });
            const body = await response.json();

            assert.equal(response.status, 200);
            assert.equal(response.headers.get("x-request-id"), "test-request-id");
            assert.deepEqual(body, { success: true, status: "ok" });
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });
});

test("readiness reports unavailable database before connection", async () => {
    await withEnv({ SLOTWISE_ENV: "test", MONGODB_URI: "mongodb://localhost:27017/slotwise-test" }, async () => {
        const { createApp } = require("../dist/app");
        const server = await listen(createApp());
        const { port } = server.address();

        try {
            const response = await fetch(`http://127.0.0.1:${port}/ready`);
            const body = await response.json();

            assert.equal(response.status, 503);
            assert.equal(body.status, "not_ready");
            assert.equal(body.checks.database, "unavailable");
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });
});

test("production API rejects forwarded HTTP requests", async () => {
    await withEnv({
        MONGODB_URI: "mongodb://localhost:27017/slotwise-test",
        SLOTWISE_AUTH_PEPPER: "pepper",
        SLOTWISE_CORS_ORIGINS: "https://app.example.com",
        SLOTWISE_ENV: "production",
    }, async () => {
        delete require.cache[require.resolve("../dist/app")];
        const { createApp } = require("../dist/app");
        const server = await listen(createApp());
        const { port } = server.address();

        try {
            const response = await fetch(`http://127.0.0.1:${port}/health`, {
                headers: { "x-forwarded-proto": "http" },
            });
            const body = await response.json();

            assert.equal(response.status, 400);
            assert.equal(body.success, false);
            assert.equal(body.error.message, "HTTPS is required");
        } finally {
            await new Promise((resolve) => server.close(resolve));
        }
    });
});
