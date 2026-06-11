import * as mongoose from "mongoose";

export interface IBooking extends mongoose.Document {
    _id: mongoose.Types.ObjectId
    userId: mongoose.Schema.Types.ObjectId
    fName: string;
    lName: string;
    gender: string;
    email: string;
    phone: string;
    startDate: Date;
    timein:Date ;
    endDate: Date;
    timeout: Date;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}

//admin can approve or reject booking
