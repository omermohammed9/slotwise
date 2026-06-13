const test = require("node:test");
const assert = require("node:assert/strict");

const { NotificationOutboxService } = require("../dist/services/notification-outbox.service");

test("NotificationOutboxService marks noop email jobs as sent and sanitizes magic-link payloads", async () => {
    const claimedJob = {
        jobId: "job-1",
        channel: "email",
        provider: "noop",
        template: "customer_magic_link",
        recipient: "jane@example.com",
        payload: {
            customerName: "Jane Doe",
            token: "raw-magic-token",
            magicLinkUrl: "https://example.com/magic?token=raw-magic-token",
            expiresAt: "2030-01-01T00:00:00.000Z",
        },
        attempts: 1,
        maxAttempts: 5,
    };
    let sentPayload = null;
    const service = new NotificationOutboxService({
        async claimPendingJobs() {
            return [claimedJob];
        },
        async markSent(_jobId, payload) {
            sentPayload = payload;
        },
        async markFailed() {
            throw new Error("markFailed should not be called");
        },
    });

    await service.processPendingJobs();

    assert.equal(sentPayload.token, "[redacted-after-send]");
    assert.equal(sentPayload.magicLinkUrl, "[redacted-after-send]");
});
