import * as mongoose from "mongoose";
import { SlotwiseRole } from "./auth.interface";
import { NotificationChannel } from "./business.interface";

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'no_show';

export interface BookingStatusAuditEntry {
    fromStatus: BookingStatus;
    toStatus: BookingStatus;
    changedAt: Date;
    changedByRole: SlotwiseRole;
    changedBy?: string;
    reason?: string;
}

export interface BookingNotificationPlan {
    channels: NotificationChannel[];
    reminderSendAt: Date[];
    confirmationPlannedAt?: Date;
    cancellationNoticePlannedAt?: Date;
    rescheduleNoticePlannedAt?: Date;
    lastPlannedAt: Date;
}

export interface BookingRescheduleEntry {
    previousStartDate: Date;
    previousEndDate: Date;
    previousTimein: Date;
    previousTimeout: Date;
    newStartDate: Date;
    newEndDate: Date;
    newTimein: Date;
    newTimeout: Date;
    rescheduledAt: Date;
    rescheduledByRole: SlotwiseRole;
    rescheduledBy?: string;
    reason?: string;
}

export type BookingConflictRiskLevel = "low" | "medium" | "high";

export interface BookingConflictRiskSignal {
    code: "starts_soon" | "approval_stale" | "repeat_reschedule" | "large_party" | "tight_turnaround" | "heavy_day_load";
    weight: number;
    message: string;
}

export interface BookingConflictRisk {
    level: BookingConflictRiskLevel;
    score: number;
    summary: string;
    evaluatedAt: Date;
    signals: BookingConflictRiskSignal[];
}

export interface IBooking extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    businessId?: mongoose.Types.ObjectId;
    customerId?: mongoose.Types.ObjectId;
    serviceResourceId?: mongoose.Types.ObjectId;
    fName: string;
    lName: string;
    gender: string;
    email: string;
    emailNormalized?: string;
    phone: string;
    phoneNormalized?: string;
    fNameNormalized?: string;
    lNameNormalized?: string;
    partySize?: number;
    notes?: string;
    startDate: Date;
    timein: Date;
    endDate: Date;
    timeout: Date;
    status: BookingStatus;
    statusHistory?: BookingStatusAuditEntry[];
    notificationPlan?: BookingNotificationPlan;
    rescheduleHistory?: BookingRescheduleEntry[];
    conflictRisk?: BookingConflictRisk;
    createdAt?: Date;
    updatedAt?: Date;
}
