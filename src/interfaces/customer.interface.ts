import * as mongoose from "mongoose";
import { NotificationChannel } from "./business.interface";

export interface ICustomer extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    businessId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    emailNormalized?: string;
    phone: string;
    phoneNormalized?: string;
    firstNameNormalized?: string;
    lastNameNormalized?: string;
    notes?: string;
    preferredNotificationChannels: NotificationChannel[];
    totalBookings: number;
    lastBookingAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
