import axios from "axios";
import { getOptionalEnv, getRequiredEnv } from "../config/env";
import { INotificationJob } from "../interfaces/notification-job.interface";
import { NotificationJobRepository, NotificationJobRepositoryContract } from "../repositories/notification-job.repository";
import { renderNotificationTemplate } from "../utils/notificationTemplates";

const defaultWorkerIntervalMs = 15_000;
const defaultBatchSize = 10;
const resendApiUrl = "https://api.resend.com/emails";

export class NotificationOutboxService {
    private static instance: NotificationOutboxService;
    private readonly notificationJobRepository: NotificationJobRepositoryContract;
    private intervalHandle?: NodeJS.Timeout;
    private processing = false;

    public constructor(
        notificationJobRepository: NotificationJobRepositoryContract = NotificationJobRepository.getInstance(),
    ) {
        this.notificationJobRepository = notificationJobRepository;
    }

    public static getInstance(): NotificationOutboxService {
        if (!NotificationOutboxService.instance) {
            NotificationOutboxService.instance = new NotificationOutboxService();
        }

        return NotificationOutboxService.instance;
    }

    public start(options: { processImmediately?: boolean } = {}): void {
        if (this.intervalHandle || !this.isWorkerEnabled()) {
            return;
        }

        if (options.processImmediately) {
            void this.processPendingJobs();
        }

        this.intervalHandle = setInterval(() => {
            void this.processPendingJobs();
        }, this.getWorkerIntervalMs());
    }

    public isRunning(): boolean {
        return Boolean(this.intervalHandle);
    }

    public stop(): void {
        if (!this.intervalHandle) {
            return;
        }

        clearInterval(this.intervalHandle);
        this.intervalHandle = undefined;
    }

    public async processPendingJobs(): Promise<void> {
        if (this.processing) {
            return;
        }

        this.processing = true;

        try {
            const jobs = await this.notificationJobRepository.claimPendingJobs(this.getWorkerBatchSize());

            for (const job of jobs) {
                await this.processJob(job);
            }
        } finally {
            this.processing = false;
        }
    }

    private async processJob(job: INotificationJob): Promise<void> {
        try {
            const rendered = renderNotificationTemplate(job.template, job.payload);
            await this.deliverJob(job, rendered.subject, rendered.text, rendered.html);
            await this.notificationJobRepository.markSent(job.jobId, rendered.sanitizedPayload);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown notification delivery error";
            const retryDelayMs = Math.min(job.attempts, job.maxAttempts) * 60_000;
            await this.notificationJobRepository.markFailed(
                job.jobId,
                errorMessage,
                new Date(Date.now() + retryDelayMs),
            );
        }
    }

    private async deliverJob(job: INotificationJob, subject: string, text: string, html: string): Promise<void> {
        if (job.channel !== "email") {
            throw new Error(`Unsupported notification channel: ${job.channel}`);
        }

        if (job.provider === "noop") {
            return;
        }

        if (job.provider !== "resend") {
            throw new Error(`Unsupported notification provider: ${job.provider}`);
        }

        await axios.post(
            resendApiUrl,
            {
                from: getRequiredEnv("SLOTWISE_EMAIL_FROM"),
                to: [job.recipient],
                subject,
                html,
                text,
            },
            {
                headers: {
                    Authorization: `Bearer ${getRequiredEnv("RESEND_API_KEY")}`,
                    "Content-Type": "application/json",
                },
                timeout: 15_000,
            },
        );
    }

    private isWorkerEnabled(): boolean {
        return getOptionalEnv("SLOTWISE_NOTIFICATION_WORKER_ENABLED") !== "false";
    }

    private getWorkerIntervalMs(): number {
        const configuredValue = getOptionalEnv("SLOTWISE_NOTIFICATION_WORKER_INTERVAL_MS");
        const intervalMs = configuredValue ? Number(configuredValue) : defaultWorkerIntervalMs;

        return Number.isInteger(intervalMs) && intervalMs > 0 ? intervalMs : defaultWorkerIntervalMs;
    }

    private getWorkerBatchSize(): number {
        const configuredValue = getOptionalEnv("SLOTWISE_NOTIFICATION_WORKER_BATCH_SIZE");
        const batchSize = configuredValue ? Number(configuredValue) : defaultBatchSize;

        return Number.isInteger(batchSize) && batchSize > 0 ? batchSize : defaultBatchSize;
    }
}
