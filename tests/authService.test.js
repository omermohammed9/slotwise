const test = require("node:test");
const assert = require("node:assert/strict");

const { AuthService } = require("../dist/services/auth.service");
const { hashPassword, hashOpaqueToken } = require("../dist/utils/authCrypto");

const createSessionRepositoryStub = () => {
    const sessionsByHash = new Map();

    return {
        async create(sessionData) {
            const session = {
                _id: "session-1",
                ...sessionData,
            };
            sessionsByHash.set(sessionData.tokenHash, session);
            return session;
        },
        async findActiveByTokenHash(tokenHash) {
            return sessionsByHash.get(tokenHash) ?? null;
        },
        async revokeByTokenHash(tokenHash) {
            return sessionsByHash.delete(tokenHash);
        },
        async touch(sessionId) {
            for (const session of sessionsByHash.values()) {
                if (session.sessionId === sessionId) {
                    session.lastSeenAt = new Date();
                }
            }
        },
    };
};

test("AuthService creates and resolves a session for configured operators", async () => {
    const passwordHash = await hashPassword("owner-pass");
    let updatedLastLoginId = null;
    const authService = new AuthService(
        {
            async findByUsername(username) {
                return username === "owner" ? {
                    _id: "operator-1",
                    actorId: "owner-42",
                    username: "owner",
                    passwordHash,
                    role: "owner",
                    active: true,
                } : null;
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin(id) {
                updatedLastLoginId = id;
            },
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() {
                return ["owner"];
            },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    const session = await authService.createSession("owner", "owner-pass");
    const resolvedSession = await authService.getSession(session.token);

    assert.equal(session.role, "owner");
    assert.equal(session.actorId, "owner-42");
    assert.equal(typeof session.token, "string");
    assert.equal(resolvedSession.username, "owner");
    assert.equal(updatedLastLoginId, "operator-1");
});

test("AuthService rejects invalid credentials", async () => {
    const passwordHash = await hashPassword("admin-pass");
    const authService = new AuthService(
        {
            async findByUsername() {
                return {
                    _id: "operator-1",
                    actorId: "admin-1",
                    username: "admin",
                    passwordHash,
                    role: "admin",
                    active: true,
                };
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return ["admin"]; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    await assert.rejects(
        async () => authService.createSession("admin", "wrong-pass"),
        /Invalid operator credentials/,
    );
});

test("AuthService records failed operator logins and locks after repeated failures", async () => {
    const passwordHash = await hashPassword("admin-pass");
    const operator = {
        _id: "operator-1",
        actorId: "admin-1",
        username: "admin",
        passwordHash,
        role: "admin",
        active: true,
        failedLoginAttempts: 4,
    };
    let recordedFailure = null;
    const authService = new AuthService(
        {
            async findByUsername() {
                return operator;
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin(id, failedLoginAttempts, lockedUntil) {
                recordedFailure = { id, failedLoginAttempts, lockedUntil };
            },
            async resetFailedLogins() {},
            async getActiveRoles() { return ["admin"]; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    await assert.rejects(
        async () => authService.createSession("admin", "wrong-pass"),
        /Operator account is temporarily locked/,
    );

    assert.equal(recordedFailure.id, "operator-1");
    assert.equal(recordedFailure.failedLoginAttempts, 5);
    assert.ok(recordedFailure.lockedUntil instanceof Date);
});

test("AuthService revokes sessions", async () => {
    const passwordHash = await hashPassword("admin-pass");
    const sessionRepository = createSessionRepositoryStub();
    const authService = new AuthService(
        {
            async findByUsername() {
                return {
                    _id: "operator-1",
                    actorId: "admin-1",
                    username: "admin",
                    passwordHash,
                    role: "admin",
                    active: true,
                };
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return ["admin"]; },
        },
        sessionRepository,
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    const session = await authService.createSession("admin", "admin-pass");

    assert.equal(await authService.revokeSession(session.token), true);
    assert.equal(await authService.getSession(session.token), null);
});

test("AuthService creates sessions for configured staff operators", async () => {
    const passwordHash = await hashPassword("staff-pass");
    const authService = new AuthService(
        {
            async findByUsername() {
                return {
                    _id: "operator-1",
                    actorId: "staff-42",
                    username: "staff",
                    passwordHash,
                    role: "staff",
                    active: true,
                };
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return ["staff"]; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    const session = await authService.createSession("staff", "staff-pass");

    assert.equal(session.role, "staff");
    assert.equal(session.actorId, "staff-42");
});

test("AuthService blocks env bootstrap outside local and test runtimes", async () => {
    const originalEnv = { ...process.env };
    process.env.SLOTWISE_ENV = "production";
    process.env.SLOTWISE_OWNER_USERNAME = "owner@example.com";
    process.env.SLOTWISE_OWNER_PASSWORD = "owner-pass";

    const authService = new AuthService(
        {
            async findByUsername() { return null; },
            async upsertBootstrapAccount() { throw new Error("bootstrap should be blocked before repository writes"); },
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return []; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveTokens() {},
            async create() {},
            async consumeActiveToken() { return null; },
        },
        {
            async create() {},
        },
    );

    await assert.rejects(
        async () => authService.bootstrapOperatorAccountsFromEnv(),
        /only available in local\/test/,
    );

    process.env = originalEnv;
});

test("AuthService queues a customer magic link job and verifies it into a customer session", async () => {
    const createdJobs = [];
    const tokenState = {};
    const sessionRepository = createSessionRepositoryStub();
    const authService = new AuthService(
        {
            async findByUsername() { return null; },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return []; },
        },
        sessionRepository,
        {
            async findByBusinessAndEmail(businessId, email) {
                if (businessId === "business-1" && email === "jane@example.com") {
                    return {
                        _id: "customer-1",
                        businessId: "business-1",
                        firstName: "Jane",
                        lastName: "Doe",
                        email: "jane@example.com",
                    };
                }

                return null;
            },
            async findById(id) {
                return id === "customer-1" ? {
                    _id: "customer-1",
                    businessId: "business-1",
                    email: "jane@example.com",
                } : null;
            },
        },
        {
            async invalidateActiveTokens() {},
            async create(tokenData) {
                tokenState.tokenHash = tokenData.tokenHash;
                tokenState.businessId = tokenData.businessId;
                tokenState.customerId = tokenData.customerId;
                tokenState.email = tokenData.email;
            },
            async consumeActiveToken(tokenHash) {
                if (tokenHash !== tokenState.tokenHash) {
                    return null;
                }

                return {
                    customerId: tokenState.customerId,
                    businessId: tokenState.businessId,
                    email: tokenState.email,
                };
            },
        },
        {
            async create(jobData) {
                createdJobs.push(jobData);
            },
        },
    );

    const magicLinkRequest = await authService.requestCustomerMagicLink("business-1", "jane@example.com");

    assert.deepEqual(magicLinkRequest, { requested: true });
    assert.equal(createdJobs.length, 1);
    assert.equal(createdJobs[0].template, "customer_magic_link");

    const rawToken = createdJobs[0].payload.token;
    assert.equal(hashOpaqueToken(rawToken), tokenState.tokenHash);

    const customerSession = await authService.verifyCustomerMagicLink(rawToken);

    assert.equal(customerSession.role, "customer");
    assert.equal(customerSession.actorId, "customer-1");
    assert.equal(customerSession.businessId, "business-1");
    assert.equal(typeof customerSession.token, "string");
});

test("AuthService queues operator invitation notifications without exposing production tokens", async () => {
    const originalEnv = { ...process.env };
    process.env.SLOTWISE_ENV = "production";
    process.env.SLOTWISE_OPERATOR_INVITATION_BASE_URL = "https://app.example.com/operators/invitations/accept";

    const createdJobs = [];
    const createdTokens = [];
    const authService = new AuthService(
        {
            async findByUsername() { return null; },
            async findAnyByUsername() { return null; },
            async create(data) {
                return { _id: "operator-2", ...data };
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return []; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveEmailTokens() {},
            async invalidateActiveTokens() {},
            async create(tokenData) {
                createdTokens.push(tokenData);
            },
            async consumeActiveToken() { return null; },
        },
        {
            async create(jobData) {
                createdJobs.push(jobData);
            },
        },
        { async record() {} },
    );

    const result = await authService.inviteOperator(
        { actorId: "owner-1", role: "owner" },
        "Staff@Example.com",
        "staff",
    );

    assert.deepEqual(result, { invited: true, operatorId: "operator-2" });
    assert.equal(createdTokens.length, 1);
    assert.equal(createdJobs.length, 1);
    assert.equal(createdJobs[0].template, "operator_invitation");
    assert.equal(createdJobs[0].recipient, "staff@example.com");
    assert.equal(createdJobs[0].payload.invitationUrl.startsWith("https://app.example.com/operators/invitations/accept?token="), true);
    assert.equal(hashOpaqueToken(createdJobs[0].payload.token), createdTokens[0].tokenHash);

    process.env = originalEnv;
});

test("AuthService queues operator password reset notifications without exposing production tokens", async () => {
    const originalEnv = { ...process.env };
    process.env.SLOTWISE_ENV = "production";
    process.env.SLOTWISE_OPERATOR_PASSWORD_RESET_BASE_URL = "https://app.example.com/operators/password-reset/complete";

    const createdJobs = [];
    const createdTokens = [];
    const authService = new AuthService(
        {
            async findByUsername() { return null; },
            async findAnyByUsername() {
                return {
                    _id: "operator-1",
                    actorId: "owner-1",
                    username: "owner@example.com",
                    role: "owner",
                    active: true,
                };
            },
            async upsertBootstrapAccount() {},
            async updateLastLogin() {},
            async recordFailedLogin() {},
            async resetFailedLogins() {},
            async getActiveRoles() { return []; },
        },
        createSessionRepositoryStub(),
        {
            async findByBusinessAndEmail() { return null; },
            async findById() { return null; },
        },
        {
            async invalidateActiveOperatorTokens() {},
            async invalidateActiveTokens() {},
            async create(tokenData) {
                createdTokens.push(tokenData);
            },
            async consumeActiveToken() { return null; },
        },
        {
            async create(jobData) {
                createdJobs.push(jobData);
            },
        },
        { async record() {} },
    );

    const result = await authService.requestOperatorPasswordReset("owner@example.com");

    assert.deepEqual(result, { requested: true });
    assert.equal(createdTokens.length, 1);
    assert.equal(createdJobs.length, 1);
    assert.equal(createdJobs[0].template, "operator_password_reset");
    assert.equal(createdJobs[0].payload.resetUrl.startsWith("https://app.example.com/operators/password-reset/complete?token="), true);
    assert.equal(hashOpaqueToken(createdJobs[0].payload.token), createdTokens[0].tokenHash);

    process.env = originalEnv;
});
