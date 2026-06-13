import mongoose, { Schema } from "mongoose";
import { IServiceResource, ServiceResourceAvailabilityOverrides } from "../interfaces/service-resource.interface";
import { BlackoutDate, WorkingHour } from "../interfaces/business.interface";

const timeOfDayRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const removeServiceResourceInternalFields = (_document: unknown, returnedObject: Record<string, unknown>) => {
    delete returnedObject.nameNormalized;
    return returnedObject;
};

const workingHourSchema = new mongoose.Schema<WorkingHour>({
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: timeOfDayRegex },
    endTime: { type: String, required: true, match: timeOfDayRegex },
    closed: { type: Boolean, default: false },
}, { _id: false });

const blackoutDateSchema = new mongoose.Schema<BlackoutDate>({
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 250 },
}, { _id: false });

const availabilityOverridesSchema = new mongoose.Schema<ServiceResourceAvailabilityOverrides>({
    slotIntervalMinutes: { type: Number, min: 5, max: 1440 },
    minAdvanceMinutes: { type: Number, min: 0, max: 525600 },
    maxAdvanceDays: { type: Number, min: 1, max: 1095 },
    bufferBeforeMinutes: { type: Number, min: 0, max: 1440 },
    bufferAfterMinutes: { type: Number, min: 0, max: 1440 },
    allowOverbooking: { type: Boolean },
    workingHours: { type: [workingHourSchema], default: undefined },
    blackoutDates: { type: [blackoutDateSchema], default: undefined },
}, { _id: false });

const serviceResourceSchema = new mongoose.Schema<IServiceResource>({
    businessId: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    nameNormalized: { type: String, required: true, index: true },
    resourceType: {
        type: String,
        required: true,
        enum: ["service", "staff", "room", "table", "equipment", "appointment", "event"],
    },
    description: { type: String, trim: true, maxlength: 1000 },
    durationMinutes: { type: Number, min: 5, max: 10080 },
    capacity: { type: Number, required: true, min: 1, default: 1 },
    active: { type: Boolean, required: true, default: true },
    requiresApproval: { type: Boolean, required: true, default: false },
    supportedRoles: {
        type: [{ type: String, enum: ["owner", "admin", "staff"] }],
        default: ["staff"],
    },
    availabilityOverrides: { type: availabilityOverridesSchema, default: undefined },
}, {
    timestamps: true,
    toJSON: { transform: removeServiceResourceInternalFields },
    toObject: { transform: removeServiceResourceInternalFields },
});

serviceResourceSchema.index({ businessId: 1, resourceType: 1, active: 1 });
serviceResourceSchema.index({ businessId: 1, nameNormalized: 1 }, { unique: true });

const serviceResourceModel = mongoose.model<IServiceResource>("ServiceResource", serviceResourceSchema);

export default serviceResourceModel;
