const test = require("node:test");
const assert = require("node:assert/strict");

const { requireAuthenticatedSession, requireRole } = require("../dist/middleware/requireRole");
const { AuthService } = require("../dist/services/auth.service");

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

const createRequest = (authorization) => ({
    header(name) {
        return name === "authorization" ? authorization : undefined;
    },
});

test("requireAuthenticatedSession returns 401 when bearer token is missing", async () => {
    const res = createResponse();
    let nextCalled = false;

    await requireAuthenticatedSession(createRequest(undefined), res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Bearer session token is required" },
    });
});

test("requireAuthenticatedSession returns 401 when session is invalid", async (t) => {
    const authService = AuthService.getInstance();
    const originalGetSession = authService.getSession;
    authService.getSession = async () => null;

    t.after(() => {
        authService.getSession = originalGetSession;
    });

    const res = createResponse();
    let nextCalled = false;

    await requireAuthenticatedSession(createRequest("Bearer invalid-token"), res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Session is invalid or expired" },
    });
});

test("requireAuthenticatedSession attaches the resolved session", async (t) => {
    const authService = AuthService.getInstance();
    const originalGetSession = authService.getSession;
    authService.getSession = async () => ({
        actorType: "operator",
        actorId: "admin-1",
        username: "admin",
        role: "admin",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });

    t.after(() => {
        authService.getSession = originalGetSession;
    });

    const req = createRequest("Bearer valid-token");
    const res = createResponse();
    let nextCalled = false;

    await requireAuthenticatedSession(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(req.slotwiseSession.role, "admin");
    assert.equal(req.slotwiseSessionToken, "valid-token");
});

test("requireRole returns 403 when session role is not allowed", async (t) => {
    const authService = AuthService.getInstance();
    const originalGetSession = authService.getSession;
    authService.getSession = async () => ({
        actorType: "operator",
        actorId: "staff-1",
        username: "staff",
        role: "staff",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });

    t.after(() => {
        authService.getSession = originalGetSession;
    });

    const middleware = requireRole(["owner", "admin"]);
    const res = createResponse();
    let nextCalled = false;

    await middleware(createRequest("Bearer valid-token"), res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Insufficient role permissions" },
    });
});

test("requireRole calls next when session role is allowed", async (t) => {
    const authService = AuthService.getInstance();
    const originalGetSession = authService.getSession;
    authService.getSession = async () => ({
        actorType: "operator",
        actorId: "owner-1",
        username: "owner",
        role: "owner",
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });

    t.after(() => {
        authService.getSession = originalGetSession;
    });

    const middleware = requireRole(["owner", "admin"]);
    const res = createResponse();
    let nextCalled = false;

    await middleware(createRequest("Bearer valid-token"), res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});
