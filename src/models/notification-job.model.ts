import mongoose, { Schema } from "mongoose";
import { INotificationJob } from "../interfaces/notification-job.interface";

const notificationJobSchema = new mongoose.Schema<INotificationJob>({
    jobId: { type: String, required: true, unique: true },
    channel: { type: String, required: true, enum: ["email", "sms"] },
    provider: { type: String, required: true, enum: ["resend", "noop"] },
    template: {
        type: String,
        required: true,
        enum: ["customer_magic_link", "operator_invitation", "operator_password_reset", "booking_confirmation", "booking_cancellation", "booking_reschedule", "booking_reminder"],
    },
    status: { type: String, required: true, enum: ["pending", "processing", "sent", "failed"], default: "pending" },
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, maxlength: 250 },
    payload: { type: Schema.Types.Mixed, required: true },
    dedupeKey: { type: String, trim: true },
    attempts: { type: Number, required: true, default: 0, min: 0 },
    maxAttempts: { type: Number, required: true, default: 5, min: 1 },
    availableAt: { type: Date, required: true },
    lockedAt: { type: Date },
    sentAt: { type: Date },
    failedAt: { type: Date },
    lastError: { type: String, maxlength: 1000 },
}, {
    timestamps: true,
});

notificationJobSchema.index({ status: 1, availableAt: 1, lockedAt: 1 });
notificationJobSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

const notificationJobModel = mongoose.model<INotificationJob>("NotificationJob", notificationJobSchema);

export default notificationJobModel;
