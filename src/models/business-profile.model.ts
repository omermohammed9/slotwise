import mongoose from "mongoose";
import {
    AvailabilityRules,
    BlackoutDate,
    BusinessMember,
    BusinessPublicPageSettings,
    BusinessTemplateKey,
    BusinessWidgetSettings,
    IBusinessProfile,
    NotificationSettings,
    WorkingHour,
} from "../interfaces/business.interface";
import { emailValidator, phoneValidator } from "../utils/validators";

const businessSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const timeOfDayRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateTimeRange = (workingHour: WorkingHour): boolean => {
    if (workingHour.closed) {
        return true;
    }

    return workingHour.startTime < workingHour.endTime;
};

const validateBlackoutWindow = (blackoutDate: BlackoutDate): boolean => blackoutDate.endDate > blackoutDate.startDate;

const workingHourSchema = new mongoose.Schema<WorkingHour>({
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: timeOfDayRegex },
    endTime: { type: String, required: true, match: timeOfDayRegex },
    closed: { type: Boolean, default: false },
}, { _id: false });

workingHourSchema.path("endTime").validate(function endTimeValidator(value: string) {
    return validateTimeRange({
        dayOfWeek: this.dayOfWeek,
        startTime: this.startTime,
        endTime: value,
        closed: this.closed,
    });
}, "Working hours endTime must be after startTime");

const blackoutDateSchema = new mongoose.Schema<BlackoutDate>({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 250 },
}, { _id: false });

blackoutDateSchema.path("endDate").validate(function blackoutEndDateValidator(value: Date) {
    return validateBlackoutWindow({
        startDate: this.startDate,
        endDate: value,
        reason: this.reason,
    });
}, "Blackout endDate must be after startDate");

const availabilityRulesSchema = new mongoose.Schema<AvailabilityRules>({
    slotIntervalMinutes: { type: Number, required: true, min: 5, max: 1440 },
    minAdvanceMinutes: { type: Number, required: true, min: 0, max: 525600 },
    maxAdvanceDays: { type: Number, required: true, min: 1, max: 1095 },
    bufferBeforeMinutes: { type: Number, required: true, min: 0, max: 1440 },
    bufferAfterMinutes: { type: Number, required: true, min: 0, max: 1440 },
    allowOverbooking: { type: Boolean, required: true, default: false },
}, { _id: false });

const notificationSettingsSchema = new mongoose.Schema<NotificationSettings>({
    enabledChannels: {
        type: [{ type: String, enum: ["email", "sms"] }],
        default: ["email"],
    },
    reminderLeadHours: {
        type: [{ type: Number, min: 1, max: 720 }],
        default: [24],
    },
    sendBookingConfirmation: { type: Boolean, default: true },
    sendCancellationNotice: { type: Boolean, default: true },
    sendRescheduleNotice: { type: Boolean, default: true },
}, { _id: false });

const widgetSettingsSchema = new mongoose.Schema<BusinessWidgetSettings>({
    enabled: { type: Boolean, required: true, default: true },
    accentColor: { type: String, required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/ },
    embedTitle: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    introMessage: { type: String, trim: true, maxlength: 250 },
    primaryActionLabel: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    showServiceSelector: { type: Boolean, required: true, default: true },
    showPartySize: { type: Boolean, required: true, default: true },
    showNotes: { type: Boolean, required: true, default: true },
    showBusinessDescription: { type: Boolean, required: true, default: true },
}, { _id: false });

const publicPageSettingsSchema = new mongoose.Schema<BusinessPublicPageSettings>({
    enabled: { type: Boolean, required: true, default: true },
    pageTitle: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    heroMessage: { type: String, trim: true, maxlength: 250 },
    logoUrl: { type: String, trim: true, maxlength: 500 },
    coverImageUrl: { type: String, trim: true, maxlength: 500 },
    showBusinessDescription: { type: Boolean, required: true, default: true },
    showAvailableResources: { type: Boolean, required: true, default: true },
    showContactDetails: { type: Boolean, required: true, default: true },
    showWorkingHours: { type: Boolean, required: true, default: true },
    confirmationMessage: { type: String, required: true, trim: true, minlength: 2, maxlength: 250 },
}, { _id: false });

const businessMemberSchema = new mongoose.Schema<BusinessMember>({
    actorId: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    role: { type: String, required: true, enum: ["owner", "admin", "staff"] },
}, { _id: false });

const businessProfileSchema = new mongoose.Schema<IBusinessProfile>({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, match: businessSlugRegex, unique: true },
    businessType: {
        type: String,
        required: true,
        enum: ["restaurant", "clinic", "salon", "consulting", "venue", "rental", "fitness", "other"],
    },
    templateKey: {
        type: String,
        enum: ["restaurant", "clinic", "salon", "consulting", "venue", "rental", "fitness"],
    } as unknown as mongoose.SchemaTypeOptions<BusinessTemplateKey>,
    timezone: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    status: { type: String, required: true, enum: ["active", "inactive"], default: "active" },
    contactEmail: { type: String, required: true, validate: emailValidator },
    contactPhone: { type: String, required: true, validate: phoneValidator },
    description: { type: String, trim: true, maxlength: 1000 },
    availabilityRules: { type: availabilityRulesSchema, required: true },
    workingHours: { type: [workingHourSchema], default: [] },
    blackoutDates: { type: [blackoutDateSchema], default: [] },
    notificationSettings: { type: notificationSettingsSchema, required: true },
    widgetSettings: { type: widgetSettingsSchema },
    publicPageSettings: { type: publicPageSettingsSchema },
    members: { type: [businessMemberSchema], default: [] },
}, {
    timestamps: true,
});

businessProfileSchema.index({ businessType: 1, status: 1 });

const businessProfileModel = mongoose.model<IBusinessProfile>("BusinessProfile", businessProfileSchema);

export default businessProfileModel;
