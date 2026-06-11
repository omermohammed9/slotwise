import mongoose, {Schema}  from "mongoose";
import {IBooking} from "../interfaces/booking.interface";
import {
    emailValidator,
    endDateValidator,
    futureDateValidator,
    nameValidator,
    phoneValidator,
} from "../utils/validators";

const removeSensitiveFields = (_document: unknown, returnedObject: Record<string, unknown>) => {
    delete returnedObject.password;
    return returnedObject;
};

const bookingSchema = new mongoose.Schema<IBooking>({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    fName: { type: String, required: true, validate: nameValidator },
    lName: { type: String, required: true, validate: nameValidator },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer not to say'], required: true },
    email: { type: String, required: true, validate: emailValidator }, // Consider adding email validation
    phone: { type: String, required: true, validate: phoneValidator },
    startDate: { type: Date, required: true, validate: futureDateValidator },
    endDate: { type: Date, required: true, validate: endDateValidator },
    timein: { type: Date, required: true, validate: futureDateValidator },
    timeout: { type: Date, required: true, validate: endDateValidator },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, {
    timestamps: true,
    toJSON: { transform: removeSensitiveFields },
    toObject: { transform: removeSensitiveFields },
});

const bookingModel = mongoose.model<IBooking>('Booking', bookingSchema);

export default bookingModel;
