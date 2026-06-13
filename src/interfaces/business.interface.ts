import * as mongoose from "mongoose";
import { SlotwiseRole } from "./auth.interface";

export type BusinessType =
    | "restaurant"
    | "clinic"
    | "salon"
    | "consulting"
    | "venue"
    | "rental"
    | "fitness"
    | "other";

export type BusinessStatus = "active" | "inactive";
export type BusinessMemberRole = Extract<SlotwiseRole, "owner" | "admin" | "staff">;
export type NotificationChannel = "email" | "sms";
export type BusinessTemplateKey =
    | "restaurant"
    | "clinic"
    | "salon"
    | "consulting"
    | "venue"
    | "rental"
    | "fitness";

export interface AvailabilityRules {
    slotIntervalMinutes: number;
    minAdvanceMinutes: number;
    maxAdvanceDays: number;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    allowOverbooking: boolean;
}

export interface WorkingHour {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    closed?: boolean;
}

export interface BlackoutDate {
    startDate: Date;
    endDate: Date;
    reason?: string;
}

export interface NotificationSettings {
    enabledChannels: NotificationChannel[];
    reminderLeadHours: number[];
    sendBookingConfirmation: boolean;
    sendCancellationNotice: boolean;
    sendRescheduleNotice: boolean;
}

export interface BusinessMember {
    actorId: string;
    displayName: string;
    role: BusinessMemberRole;
}

export interface BusinessTemplateSuggestedResource {
    name: string;
    resourceType:
        | "service"
        | "staff"
        | "room"
        | "table"
        | "equipment"
        | "appointment"
        | "event";
    capacity: number;
    durationMinutes?: number;
    requiresApproval?: boolean;
}

export interface BusinessWidgetSettings {
    enabled: boolean;
    accentColor: string;
    embedTitle: string;
    introMessage?: string;
    primaryActionLabel: string;
    showServiceSelector: boolean;
    showPartySize: boolean;
    showNotes: boolean;
    showBusinessDescription: boolean;
}

export interface BusinessPublicPageSettings {
    enabled: boolean;
    pageTitle: string;
    heroMessage?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    showBusinessDescription: boolean;
    showAvailableResources: boolean;
    showContactDetails: boolean;
    showWorkingHours: boolean;
    confirmationMessage: string;
}

export interface BusinessTemplatePreset {
    key: BusinessTemplateKey;
    label: string;
    description: string;
    businessType: Exclude<BusinessType, "other">;
    availabilityRules: AvailabilityRules;
    workingHours: WorkingHour[];
    notificationSettings: NotificationSettings;
    widgetSettings: BusinessWidgetSettings;
    publicPageSettings: BusinessPublicPageSettings;
    suggestedResources: BusinessTemplateSuggestedResource[];
}

export interface IBusinessProfile extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    businessType: BusinessType;
    templateKey?: BusinessTemplateKey;
    timezone: string;
    status: BusinessStatus;
    contactEmail: string;
    contactPhone: string;
    description?: string;
    availabilityRules: AvailabilityRules;
    workingHours: WorkingHour[];
    blackoutDates: BlackoutDate[];
    notificationSettings: NotificationSettings;
    widgetSettings?: BusinessWidgetSettings;
    publicPageSettings?: BusinessPublicPageSettings;
    members: BusinessMember[];
    createdAt?: Date;
    updatedAt?: Date;
}
