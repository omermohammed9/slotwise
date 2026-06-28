import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { validateNotificationWorkerConfig } from "./config/env";
import { NotificationOutboxService } from "./services/notification-outbox.service";
import { log } from "./utils/logger";

export const startNotificationWorker = async (): Promise<() => Promise<void>> => {
    validateNotificationWorkerConfig();
    await connectDB();

    const service = NotificationOutboxService.getInstance();
    service.start({ processImmediately: true });
    log("info", "notification_worker_started");

    return async () => {
        service.stop();
        await mongoose.disconnect();
        log("info", "notification_worker_stopped");
    };
};

if (require.main === module) {
    let stopWorker: (() => Promise<void>) | undefined;

    const shutdown = async () => {
        if (stopWorker) {
            await stopWorker();
        }

        process.exit(0);
    };

    process.once("SIGINT", () => void shutdown());
    process.once("SIGTERM", () => void shutdown());

    startNotificationWorker()
        .then((stop) => {
            stopWorker = stop;
        })
        .catch((error) => {
            log("error", "notification_worker_startup_failed", { error });
            process.exit(1);
        });
}
