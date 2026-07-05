import mongoose, { Schema }  from "mongoose";
import { BookingConflictRisk, IBooking } from "../interfaces/booking.interface";
import {
    emailValidator,
    endDateValidator,
    futureDateValidator,
    nameValidator,
    phoneValidator,
} from "../utils/validators";

const removeSensitiveFields = (_document: unknown, returnedObject: Record<string, unknown>) => {
    delete returnedObject.password;
    delete returnedObject.emailNormalized;
    delete returnedObject.phoneNormalized;
    delete returnedObject.fNameNormalized;
    delete returnedObject.lNameNormalized;
    return returnedObject;
};

const statusHistorySchema = new mongoose.Schema({
    fromStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'], required: true },
    toStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'], required: true },
    changedAt: { type: Date, required: true },
    changedByRole: { type: String, enum: ['owner', 'admin', 'staff', 'customer', 'system'], required: true },
    changedBy: { type: String },
    reason: { type: String },
}, { _id: false });

const notificationPlanSchema = new mongoose.Schema({
    channels: { type: [{ type: String, enum: ["email", "sms"] }], default: [] },
    reminderSendAt: { type: [{ type: Date }], default: [] },
    confirmationPlannedAt: { type: Date },
    cancellationNoticePlannedAt: { type: Date },
    rescheduleNoticePlannedAt: { type: Date },
    lastPlannedAt: { type: Date, required: true },
}, { _id: false });

const rescheduleHistorySchema = new mongoose.Schema({
    previousStartDate: { type: Date, required: true },
    previousEndDate: { type: Date, required: true },
    previousTimein: { type: Date, required: true },
    previousTimeout: { type: Date, required: true },
    newStartDate: { type: Date, required: true },
    newEndDate: { type: Date, required: true },
    newTimein: { type: Date, required: true },
    newTimeout: { type: Date, required: true },
    rescheduledAt: { type: Date, required: true },
    rescheduledByRole: { type: String, enum: ["owner", "admin", "staff", "customer", "system"], required: true },
    rescheduledBy: { type: String },
    reason: { type: String },
}, { _id: false });

const conflictRiskSignalSchema = new mongoose.Schema({
    code: {
        type: String,
        enum: ["starts_soon", "approval_stale", "repeat_reschedule", "large_party", "tight_turnaround", "heavy_day_load"],
        required: true,
    },
    weight: { type: Number, required: true, min: 0, max: 100 },
    message: { type: String, required: true, trim: true, maxlength: 250 },
}, { _id: false });

const conflictRiskSchema = new mongoose.Schema<BookingConflictRisk>({
    level: { type: String, enum: ["low", "medium", "high"], required: true, default: "low" },
    score: { type: Number, required: true, min: 0, max: 100, default: 0 },
    summary: { type: String, required: true, trim: true, maxlength: 250 },
    evaluatedAt: { type: Date, required: true },
    signals: { type: [conflictRiskSignalSchema], default: [] },
}, { _id: false });

const bookingSchema = new mongoose.Schema<IBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    businessId: { type: Schema.Types.ObjectId, ref: 'BusinessProfile' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    serviceResourceId: { type: Schema.Types.ObjectId, ref: 'ServiceResource' },
    fName: { type: String, required: true, validate: nameValidator },
    lName: { type: String, required: true, validate: nameValidator },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer not to say'], required: true },
    email: { type: String, required: true, validate: emailValidator },
    emailNormalized: { type: String, required: true, index: true },
    phone: { type: String, required: true, validate: phoneValidator },
    phoneNormalized: { type: String, required: true, index: true },
    fNameNormalized: { type: String, required: true, index: true },
    lNameNormalized: { type: String, required: true, index: true },
    partySize: { type: Number, min: 1, max: 1000, default: 1 },
    notes: { type: String, trim: true, maxlength: 1000 },
    startDate: { type: Date, required: true, validate: futureDateValidator },
    endDate: { type: Date, required: true, validate: endDateValidator },
    timein: { type: Date, required: true, validate: futureDateValidator },
    timeout: { type: Date, required: true, validate: endDateValidator },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'], default: 'pending' },
    statusHistory: { type: [statusHistorySchema], default: [] },
    notificationPlan: { type: notificationPlanSchema },
    rescheduleHistory: { type: [rescheduleHistorySchema], default: [] },
    conflictRisk: { type: conflictRiskSchema },
}, {
    timestamps: true,
    toJSON: { transform: removeSensitiveFields },
    toObject: { transform: removeSensitiveFields },
});

bookingSchema.index({ status: 1, startDate: 1 });
bookingSchema.index({ businessId: 1, serviceResourceId: 1, startDate: 1, timein: 1 });
bookingSchema.index({ businessId: 1, createdAt: -1 });
bookingSchema.index({ businessId: 1, status: 1, startDate: 1 });
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ "conflictRisk.level": 1, "conflictRisk.score": -1 });
bookingSchema.index({ createdAt: -1 });

const bookingModel = mongoose.model<IBooking>('Booking', bookingSchema);

export default bookingModel;
