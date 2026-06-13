import * as mongoose from "mongoose";
import {
    AvailabilityRules,
    BlackoutDate,
    BusinessMemberRole,
    WorkingHour,
} from "./business.interface";

export type ServiceResourceType =
    | "service"
    | "staff"
    | "room"
    | "table"
    | "equipment"
    | "appointment"
    | "event";

export interface ServiceResourceAvailabilityOverrides extends Partial<AvailabilityRules> {
    workingHours?: WorkingHour[];
    blackoutDates?: BlackoutDate[];
}

export interface IServiceResource extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    businessId: mongoose.Types.ObjectId;
    name: string;
    nameNormalized?: string;
    resourceType: ServiceResourceType;
    description?: string;
    durationMinutes?: number;
    capacity: number;
    active: boolean;
    requiresApproval: boolean;
    supportedRoles: BusinessMemberRole[];
    availabilityOverrides?: ServiceResourceAvailabilityOverrides;
    createdAt?: Date;
    updatedAt?: Date;
}
