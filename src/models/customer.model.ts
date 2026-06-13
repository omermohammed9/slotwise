import mongoose, { Schema } from "mongoose";
import { ICustomer } from "../interfaces/customer.interface";
import { emailValidator, nameValidator, phoneValidator } from "../utils/validators";

const removeCustomerInternalFields = (_document: unknown, returnedObject: Record<string, unknown>) => {
    delete returnedObject.emailNormalized;
    delete returnedObject.phoneNormalized;
    delete returnedObject.firstNameNormalized;
    delete returnedObject.lastNameNormalized;
    return returnedObject;
};

const customerSchema = new mongoose.Schema<ICustomer>({
    businessId: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
    firstName: { type: String, required: true, validate: nameValidator },
    lastName: { type: String, required: true, validate: nameValidator },
    email: { type: String, required: true, validate: emailValidator },
    emailNormalized: { type: String, required: true },
    phone: { type: String, required: true, validate: phoneValidator },
    phoneNormalized: { type: String, required: true },
    firstNameNormalized: { type: String, required: true },
    lastNameNormalized: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 1000 },
    preferredNotificationChannels: {
        type: [{ type: String, enum: ["email", "sms"] }],
        default: ["email"],
    },
    totalBookings: { type: Number, required: true, default: 0, min: 0 },
    lastBookingAt: { type: Date },
}, {
    timestamps: true,
    toJSON: { transform: removeCustomerInternalFields },
    toObject: { transform: removeCustomerInternalFields },
});

customerSchema.index({ businessId: 1, emailNormalized: 1 }, { unique: true });
customerSchema.index({ businessId: 1, phoneNormalized: 1 });
customerSchema.index({ businessId: 1, lastNameNormalized: 1, firstNameNormalized: 1 });

const customerModel = mongoose.model<ICustomer>("Customer", customerSchema);

export default customerModel;
