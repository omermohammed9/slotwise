const test = require("node:test");
const assert = require("node:assert/strict");

const { requireCsrfForCookieSession } = require("../dist/middleware/csrf");
const { allowConfiguredCors } = require("../dist/middleware/cors");
const { createRateLimiter, resetRateLimitBuckets } = require("../dist/middleware/rateLimit");
const { clearSessionCookie, setCsrfCookie, setSessionCookie } = require("../dist/utils/sessionCookie");

const createResponse = () => ({
    headers: {},
    statusCode: 200,
    jsonPayload: undefined,
    getHeader(name) {
        return this.headers[name.toLowerCase()];
    },
    setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
    },
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.jsonPayload = payload;
        return this;
    },
    sendStatus(code) {
        this.statusCode = code;
        return this;
    },
});

const createRequest = ({ method = "POST", cookie, csrfToken, ip = "127.0.0.1", origin } = {}) => ({
    ip,
    method,
    headers: { origin },
    socket: {},
    header(name) {
        if (name === "cookie") return cookie;
        if (name === "x-csrf-token") return csrfToken;
        return undefined;
    },
});

test("session cookies are HttpOnly, SameSite, and paired with readable CSRF cookies", () => {
    const res = createResponse();
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");

    setSessionCookie(res, "session-token", expiresAt);
    setCsrfCookie(res, "csrf-token", expiresAt);

    const cookies = res.headers["set-cookie"];
    assert.equal(cookies.length, 2);
    assert.match(cookies[0], /slotwise_session=session-token/);
    assert.match(cookies[0], /HttpOnly/);
    assert.match(cookies[0], /SameSite=Lax/);
    assert.match(cookies[1], /slotwise_csrf=csrf-token/);
    assert.doesNotMatch(cookies[1], /HttpOnly/);
});

test("clearSessionCookie expires the HttpOnly session cookie", () => {
    const res = createResponse();

    clearSessionCookie(res);

    assert.match(res.headers["set-cookie"], /Max-Age=0/);
    assert.match(res.headers["set-cookie"], /HttpOnly/);
});

test("CSRF middleware rejects unsafe cookie-session requests without matching token", () => {
    const req = createRequest({ cookie: "slotwise_session=session-token; slotwise_csrf=csrf-token" });
    const res = createResponse();
    let nextCalled = false;

    requireCsrfForCookieSession(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 419);
});

test("CSRF middleware allows unsafe public requests without a cookie session", () => {
    const req = createRequest();
    const res = createResponse();
    let nextCalled = false;

    requireCsrfForCookieSession(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("CSRF middleware accepts matching double-submit tokens", () => {
    const req = createRequest({
        cookie: "slotwise_session=session-token; slotwise_csrf=csrf-token",
        csrfToken: "csrf-token",
    });
    const res = createResponse();
    let nextCalled = false;

    requireCsrfForCookieSession(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("rate limiter returns 429 after the configured limit", () => {
    resetRateLimitBuckets();
    const limiter = createRateLimiter({ keyPrefix: "test", limit: 2, windowMs: 60_000 });
    const req = createRequest();
    const firstResponse = createResponse();
    const secondResponse = createResponse();
    const thirdResponse = createResponse();

    limiter(req, firstResponse, () => {});
    limiter(req, secondResponse, () => {});
    limiter(req, thirdResponse, () => {});

    assert.equal(thirdResponse.statusCode, 429);
    assert.equal(thirdResponse.jsonPayload.error.message, "Too many requests. Please try again later.");
});

test("CORS middleware echoes only configured origins and handles preflight", () => {
    const original = { ...process.env };
    process.env.SLOTWISE_ENV = "test";
    process.env.SLOTWISE_CORS_ORIGINS = "https://app.example.com";

    try {
        const allowedReq = createRequest({ method: "OPTIONS", origin: "https://app.example.com" });
        const allowedRes = createResponse();
        let allowedNextCalled = false;

        allowConfiguredCors(allowedReq, allowedRes, () => {
            allowedNextCalled = true;
        });

        assert.equal(allowedNextCalled, false);
        assert.equal(allowedRes.statusCode, 204);
        assert.equal(allowedRes.getHeader("access-control-allow-origin"), "https://app.example.com");
        assert.equal(allowedRes.getHeader("access-control-allow-credentials"), "true");

        const deniedReq = createRequest({ method: "OPTIONS", origin: "https://evil.example.com" });
        const deniedRes = createResponse();

        allowConfiguredCors(deniedReq, deniedRes, () => {});

        assert.equal(deniedRes.statusCode, 204);
        assert.equal(deniedRes.getHeader("access-control-allow-origin"), undefined);
    } finally {
        process.env = original;
    }
});
