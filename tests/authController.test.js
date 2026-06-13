const test = require("node:test");
const assert = require("node:assert/strict");

const { AuthController } = require("../dist/controllers/auth.controller");

const createResponse = () => ({
    statusCode: 200,
    jsonPayload: undefined,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.jsonPayload = payload;
        return this;
    },
});

test("createSession returns 400 when credentials are missing", async () => {
    const controller = new AuthController({
        createSession: () => {
            throw new Error("should not be called");
        },
    });

    const req = { body: {} };
    const res = createResponse();

    await controller.createSession(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Username and password are required" },
    });
});

test("createSession returns session payload on success", async () => {
    const controller = new AuthController({
        createSession: async () => ({
            token: "token-1",
            actorType: "operator",
            actorId: "admin-1",
            username: "admin",
            role: "admin",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        }),
    });

    const req = { body: { username: "admin", password: "secret" } };
    const res = createResponse();

    await controller.createSession(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.token, "token-1");
});

test("getCurrentSession returns the authenticated session", () => {
    const controller = new AuthController();
    const req = {
        slotwiseSession: {
            actorId: "owner-1",
            username: "owner",
            role: "owner",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    controller.getCurrentSession(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.role, "owner");
});

test("deleteSession revokes the authenticated session", async () => {
    let revokedToken = null;
    const controller = new AuthController({
        revokeSession: async (token) => {
            revokedToken = token;
            return true;
        },
    });
    const req = {
        slotwiseSessionToken: "token-1",
    };
    const res = createResponse();

    await controller.deleteSession(req, res);

    assert.equal(revokedToken, "token-1");
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.jsonPayload, {
        success: true,
        data: { revoked: true },
    });
});

test("requestCustomerMagicLink validates required fields", async () => {
    const controller = new AuthController({
        requestCustomerMagicLink: async () => ({ requested: true }),
    });
    const res = createResponse();

    await controller.requestCustomerMagicLink({ body: {} }, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "businessId and email are required" },
    });
});

test("verifyCustomerMagicLink returns session payload on success", async () => {
    const controller = new AuthController({
        verifyCustomerMagicLink: async () => ({
            token: "customer-token-1",
            actorType: "customer",
            actorId: "customer-1",
            role: "customer",
            email: "jane@example.com",
            businessId: "business-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        }),
    });
    const res = createResponse();

    await controller.verifyCustomerMagicLink({ body: { token: "magic-token" } }, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.actorType, "customer");
});
