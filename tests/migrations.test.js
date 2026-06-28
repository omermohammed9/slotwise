const test = require("node:test");
const assert = require("node:assert/strict");

test("migration registry is ordered and includes core index migration", () => {
    const { migrations } = require("../dist/scripts/run-migrations");

    assert.equal(migrations.length >= 1, true);
    assert.deepEqual(migrations.map((migration) => migration.id), [...migrations.map((migration) => migration.id)].sort());
    assert.equal(migrations[0].id, "20260616-sync-core-indexes");
});

test("core index migration registers every core collection model", () => {
    require("../dist/scripts/run-migrations");
    const mongoose = require("mongoose");

    [
        "AuditLog",
        "AuthSession",
        "Booking",
        "BusinessProfile",
        "Customer",
        "OperatorAccount",
        "ServiceResource",
        "VerificationToken",
    ].forEach((modelName) => {
        assert.ok(mongoose.models[modelName], `Expected ${modelName} to be registered`);
    });
});
