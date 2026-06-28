const test = require("node:test");
const assert = require("node:assert/strict");

const withEnv = async (values, callback) => {
    const original = { ...process.env };
    Object.assign(process.env, values);

    try {
        await callback();
    } finally {
        process.env = original;
    }
};

test("notification worker validates config, starts the outbox, and shuts down cleanly", async () => {
    await withEnv({ SLOTWISE_ENV: "test", MONGODB_URI: "mongodb://localhost:27017/slotwise-worker-test" }, async () => {
        const db = require("../dist/config/db");
        const mongoose = require("mongoose");
        const env = require("../dist/config/env");
        const { NotificationOutboxService } = require("../dist/services/notification-outbox.service");

        const originalConnectDB = db.connectDB;
        const originalDisconnect = mongoose.disconnect;
        const originalValidateNotificationWorkerConfig = env.validateNotificationWorkerConfig;
        const originalGetInstance = NotificationOutboxService.getInstance;

        let validated = false;
        let connected = false;
        let disconnected = false;
        let startOptions = null;
        let stopped = false;

        db.connectDB = async () => {
            connected = true;
        };
        mongoose.disconnect = async () => {
            disconnected = true;
        };
        env.validateNotificationWorkerConfig = () => {
            validated = true;
        };
        NotificationOutboxService.getInstance = () => ({
            start(options) {
                startOptions = options;
            },
            stop() {
                stopped = true;
            },
        });

        delete require.cache[require.resolve("../dist/worker")];
        const { startNotificationWorker } = require("../dist/worker");

        try {
            const stopWorker = await startNotificationWorker();

            assert.equal(validated, true);
            assert.equal(connected, true);
            assert.deepEqual(startOptions, { processImmediately: true });

            await stopWorker();

            assert.equal(stopped, true);
            assert.equal(disconnected, true);
        } finally {
            db.connectDB = originalConnectDB;
            mongoose.disconnect = originalDisconnect;
            env.validateNotificationWorkerConfig = originalValidateNotificationWorkerConfig;
            NotificationOutboxService.getInstance = originalGetInstance;
            delete require.cache[require.resolve("../dist/worker")];
        }
    });
});
