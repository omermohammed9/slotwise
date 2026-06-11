import validator from "validator";
import {isPossiblePhoneNumber, isValidPhoneNumber, validatePhoneNumberLength} from "libphonenumber-js";
import mongoose from "mongoose";


const nameRegex = /^[a-zA-Z\s]+$/;
export const nameValidator = {
    validator: function(name: string) {
        const sanitized: string = validator.trim(name);
        return nameRegex.test(sanitized);
    },
    message: (props: mongoose.ValidatorProps)  => `${props.value} is not a valid name!`
};


export const emailValidator = {
    validator: function(email: string) {
        return validator.isEmail(email);
    },
    message: (props: mongoose.ValidatorProps)  => `${props.value} is not a valid email!`
};

export const phoneValidator = {
    validator: function(phone: string) {
        return (
            isValidPhoneNumber(phone)
            && validatePhoneNumberLength(phone) === undefined
            && isPossiblePhoneNumber(phone)
        );
    },
    message: (props: mongoose.ValidatorProps)  => `${props.value} is not a valid phone number!`
};

export const futureDateValidator = {
    validator: function(value: Date) {
        return value.getTime() > Date.now();
    },
    message: 'Date cannot be in the past.'
};

export const endDateValidator = {
    validator: function(value: Date) {
        const booking = this as { startDate?: Date };
        return booking.startDate ? value > booking.startDate : true;
    },
    message: 'End date must be after start date.'
};
