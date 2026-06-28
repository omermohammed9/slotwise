const test = require("node:test");
const assert = require("node:assert/strict");

const {
    requireBusinessScopeAccess,
    requireResolvedBusinessScopeAccess,
} = require("../dist/middleware/businessAuthorization");

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

test("business scope authorization denies cross-business staff access", () => {
    const req = {
        body: { businessId: "business-2" },
        params: {},
        query: {},
        slotwiseSession: { role: "staff", businessId: "business-1" },
    };
    const res = createResponse();
    let nextCalled = false;

    requireBusinessScopeAccess(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error.message, "Business access is denied");
});

test("business scope authorization denies unscoped admin access", () => {
    const req = {
        body: {},
        params: {},
        query: {},
        slotwiseSession: { role: "admin", businessId: "business-1" },
    };
    const res = createResponse();

    requireBusinessScopeAccess(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error.message, "Business scope is required");
});

test("business scope authorization allows owner global access", () => {
    const req = {
        body: {},
        params: {},
        query: {},
        slotwiseSession: { role: "owner" },
    };
    const res = createResponse();
    let nextCalled = false;

    requireBusinessScopeAccess(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("resolved business scope authorization denies cross-business resource access", async () => {
    const middleware = requireResolvedBusinessScopeAccess(async () => "business-2");
    const req = {
        body: {},
        params: { id: "resource-1" },
        query: {},
        slotwiseSession: { role: "admin", businessId: "business-1" },
    };
    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error.message, "Business access is denied");
});

test("resolved business scope authorization denies conflicting requested business ids", async () => {
    const middleware = requireResolvedBusinessScopeAccess(async () => "business-1");
    const req = {
        body: { businessId: "business-2" },
        params: { id: "resource-1" },
        query: {},
        slotwiseSession: { role: "staff", businessId: "business-1" },
    };
    const res = createResponse();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonPayload.error.message, "Business access is denied");
});

test("resolved business scope authorization returns 404 when resource is missing", async () => {
    const middleware = requireResolvedBusinessScopeAccess(async () => null);
    const req = {
        body: {},
        params: { id: "missing-resource" },
        query: {},
        slotwiseSession: { role: "staff", businessId: "business-1" },
    };
    const res = createResponse();

    await middleware(req, res, () => {});

    assert.equal(res.statusCode, 404);
    assert.equal(res.jsonPayload.error.message, "Business-scoped resource not found");
});

test("resolved business scope authorization allows owner without resolving resource", async () => {
    let resolverCalled = false;
    const middleware = requireResolvedBusinessScopeAccess(async () => {
        resolverCalled = true;
        return null;
    });
    const req = {
        body: {},
        params: { id: "resource-1" },
        query: {},
        slotwiseSession: { role: "owner" },
    };
    const res = createResponse();
    let nextCalled = false;

    await middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(resolverCalled, false);
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});
