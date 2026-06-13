import { INotificationJob, NotificationProvider } from "../interfaces/notification-job.interface";
import notificationJobModel from "../models/notification-job.model";

export interface NotificationJobCreateData {
    jobId: string;
    channel: INotificationJob["channel"];
    provider: NotificationProvider;
    template: INotificationJob["template"];
    recipient: string;
    subject?: string;
    payload: Record<string, unknown>;
    dedupeKey?: string;
    maxAttempts?: number;
    availableAt: Date;
}

export interface NotificationJobRepositoryContract {
    create(jobData: NotificationJobCreateData): Promise<INotificationJob>;
    claimPendingJobs(limit: number): Promise<INotificationJob[]>;
    markSent(jobId: string, payload?: Record<string, unknown>): Promise<void>;
    markFailed(jobId: string, errorMessage: string, nextAvailableAt: Date): Promise<void>;
}

export class NotificationJobRepository implements NotificationJobRepositoryContract {
    private static instance: NotificationJobRepository;

    public static getInstance(): NotificationJobRepository {
        if (!NotificationJobRepository.instance) {
            NotificationJobRepository.instance = new NotificationJobRepository();
        }

        return NotificationJobRepository.instance;
    }

    public async create(jobData: NotificationJobCreateData): Promise<INotificationJob> {
        const job = new notificationJobModel({
            ...jobData,
            attempts: 0,
            status: "pending",
            maxAttempts: jobData.maxAttempts ?? 5,
        });
        await job.save();
        return job;
    }

    public async claimPendingJobs(limit: number): Promise<INotificationJob[]> {
        const claimedJobs: INotificationJob[] = [];
        const lockCutoff = new Date(Date.now() - 5 * 60_000);

        for (let index = 0; index < limit; index += 1) {
            const query: Record<string, unknown> = {
                status: { $in: ["pending", "failed"] },
                $expr: { $lt: ["$attempts", "$maxAttempts"] },
                availableAt: { $lte: new Date() },
                $or: [
                    { lockedAt: { $exists: false } },
                    { lockedAt: { $lte: lockCutoff } },
                ],
            };

            const job = await notificationJobModel.findOneAndUpdate(
                query,
                {
                    $set: {
                        status: "processing",
                        lockedAt: new Date(),
                    },
                    $inc: { attempts: 1 },
                },
                {
                    new: true,
                    sort: { availableAt: 1, createdAt: 1 },
                    includeResultMetadata: false,
                },
            );

            if (!job) {
                break;
            }

            claimedJobs.push(job);
        }

        return claimedJobs;
    }

    public async markSent(jobId: string, payload?: Record<string, unknown>): Promise<void> {
        await notificationJobModel.updateOne(
            { jobId },
            {
                $set: {
                    status: "sent",
                    sentAt: new Date(),
                    ...(payload ? { payload } : {}),
                },
                $unset: {
                    lockedAt: "",
                    lastError: "",
                },
            },
        );
    }

    public async markFailed(jobId: string, errorMessage: string, nextAvailableAt: Date): Promise<void> {
        await notificationJobModel.updateOne(
            { jobId },
            {
                $set: {
                    status: "failed",
                    failedAt: new Date(),
                    availableAt: nextAvailableAt,
                    lastError: errorMessage,
                },
                $unset: {
                    lockedAt: "",
                },
            },
        );
    }
}
