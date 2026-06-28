const test = require("node:test");
const assert = require("node:assert/strict");

const { setupFirstOwner } = require("../dist/scripts/setup-first-owner");
const { verifyPassword } = require("../dist/utils/authCrypto");

test("setupFirstOwner creates the first active owner", async () => {
    let createdAccount = null;
    const result = await setupFirstOwner("OWNER@Example.com", "owner-pass-123", {
        async countActiveOwners() { return 0; },
        async findAnyByUsername() { return null; },
        async create(accountData) {
            createdAccount = accountData;
            return { _id: "operator-1", ...accountData };
        },
    });

    assert.deepEqual(result, { created: true, operatorId: "operator-1" });
    assert.equal(createdAccount.username, "owner@example.com");
    assert.equal(createdAccount.role, "owner");
    assert.equal(createdAccount.active, true);
    assert.equal(await verifyPassword("owner-pass-123", createdAccount.passwordHash), true);
});

test("setupFirstOwner refuses to run when an active owner exists", async () => {
    await assert.rejects(
        async () => setupFirstOwner("owner@example.com", "owner-pass-123", {
            async countActiveOwners() { return 1; },
            async findAnyByUsername() { return null; },
            async create() { throw new Error("create should not run"); },
        }),
        /active owner already exists/,
    );
});

test("setupFirstOwner refuses duplicate operator usernames", async () => {
    await assert.rejects(
        async () => setupFirstOwner("owner@example.com", "owner-pass-123", {
            async countActiveOwners() { return 0; },
            async findAnyByUsername() { return { _id: "operator-1" }; },
            async create() { throw new Error("create should not run"); },
        }),
        /Operator username already exists/,
    );
});
