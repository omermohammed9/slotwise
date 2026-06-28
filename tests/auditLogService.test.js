const test = require("node:test");
const assert = require("node:assert/strict");

const { AuditLogService } = require("../dist/services/audit-log.service");

test("AuditLogService scopes admin queries to the actor business", async () => {
    let receivedQuery = null;
    const service = new AuditLogService({
        async create() {},
        async find(query) {
            receivedQuery = query;
            return { logs: [], total: 0, page: 1, limit: 50, totalPages: 1 };
        },
    });

    await service.list(
        { role: "admin", actorId: "admin-1", businessId: "business-1" },
        { businessId: "business-2", action: "booking.updated" },
    );

    assert.equal(receivedQuery.businessId, "business-1");
    assert.equal(receivedQuery.action, "booking.updated");
});

test("AuditLogService rejects unscoped admin queries", async () => {
    const service = new AuditLogService({
        async create() {},
        async find() {
            return { logs: [], total: 0, page: 1, limit: 50, totalPages: 1 };
        },
    });

    await assert.rejects(
        service.list({ role: "admin", actorId: "admin-1" }, {}),
        /Business scope is required/,
    );
});

test("AuditLogService allows owner queries across businesses", async () => {
    let receivedQuery = null;
    const service = new AuditLogService({
        async create() {},
        async find(query) {
            receivedQuery = query;
            return { logs: [], total: 0, page: 1, limit: 50, totalPages: 1 };
        },
    });

    await service.list(
        { role: "owner", actorId: "owner-1" },
        { businessId: "business-2" },
    );

    assert.equal(receivedQuery.businessId, "business-2");
});

test("AuditLogService exports scoped CSV", async () => {
    const service = new AuditLogService({
        async create() {},
        async find(query) {
            assert.equal(query.businessId, "business-1");
            return {
                logs: [{
                    actorId: "admin-1",
                    actorRole: "admin",
                    businessId: "business-1",
                    action: "booking.updated",
                    targetEntity: "booking",
                    targetId: "booking-1",
                    requestId: "request-1",
                    metadata: { reason: "Customer called" },
                    createdAt: new Date("2030-01-02T03:04:05.000Z"),
                }],
                total: 1,
                page: 1,
                limit: 50,
                totalPages: 1,
            };
        },
    });

    const csv = await service.exportCsv(
        { role: "admin", actorId: "admin-1", businessId: "business-1" },
        {},
    );

    assert.match(csv, /createdAt,actorRole,actorId,action/);
    assert.match(csv, /2030-01-02T03:04:05.000Z,admin,admin-1,booking.updated/);
    assert.match(csv, /"{""reason"":""Customer called""}"/);
});
