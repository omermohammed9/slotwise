import * as mongoose from "mongoose";

export type NotificationJobStatus = "pending" | "processing" | "sent" | "failed";
export type NotificationChannelType = "email" | "sms";
export type NotificationProvider = "resend" | "noop";
export type NotificationTemplate =
    | "customer_magic_link"
    | "booking_confirmation"
    | "booking_cancellation"
    | "booking_reschedule"
    | "booking_reminder";

export interface INotificationJob extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    jobId: string;
    channel: NotificationChannelType;
    provider: NotificationProvider;
    template: NotificationTemplate;
    status: NotificationJobStatus;
    recipient: string;
    subject?: string;
    payload: Record<string, unknown>;
    dedupeKey?: string;
    attempts: number;
    maxAttempts: number;
    availableAt: Date;
    lockedAt?: Date;
    sentAt?: Date;
    failedAt?: Date;
    lastError?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
