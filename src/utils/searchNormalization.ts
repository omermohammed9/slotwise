import { IBooking } from "../interfaces/booking.interface";
import { ICustomer } from "../interfaces/customer.interface";
import { IServiceResource } from "../interfaces/service-resource.interface";

export interface BookingSearchFields {
    emailNormalized?: string;
    phoneNormalized?: string;
    fNameNormalized?: string;
    lNameNormalized?: string;
}

export interface CustomerSearchFields {
    emailNormalized?: string;
    phoneNormalized?: string;
    firstNameNormalized?: string;
    lastNameNormalized?: string;
}

export interface ServiceResourceSearchFields {
    nameNormalized?: string;
}

export const normalizeEmailSearch = (value: string): string => value.trim().toLowerCase();

export const normalizePhoneSearch = (value: string): string => value.replace(/\D/g, "");

export const normalizeNameSearch = (value: string): string => value.trim().toLowerCase();

export const buildBookingSearchFields = (bookingData: Partial<IBooking>): BookingSearchFields => {
    const searchFields: BookingSearchFields = {};

    if (typeof bookingData.email === "string") {
        searchFields.emailNormalized = normalizeEmailSearch(bookingData.email);
    }

    if (typeof bookingData.phone === "string") {
        searchFields.phoneNormalized = normalizePhoneSearch(bookingData.phone);
    }

    if (typeof bookingData.fName === "string") {
        searchFields.fNameNormalized = normalizeNameSearch(bookingData.fName);
    }

    if (typeof bookingData.lName === "string") {
        searchFields.lNameNormalized = normalizeNameSearch(bookingData.lName);
    }

    return searchFields;
};

export const buildCustomerSearchFields = (customerData: Partial<ICustomer>): CustomerSearchFields => {
    const searchFields: CustomerSearchFields = {};

    if (typeof customerData.email === "string") {
        searchFields.emailNormalized = normalizeEmailSearch(customerData.email);
    }

    if (typeof customerData.phone === "string") {
        searchFields.phoneNormalized = normalizePhoneSearch(customerData.phone);
    }

    if (typeof customerData.firstName === "string") {
        searchFields.firstNameNormalized = normalizeNameSearch(customerData.firstName);
    }

    if (typeof customerData.lastName === "string") {
        searchFields.lastNameNormalized = normalizeNameSearch(customerData.lastName);
    }

    return searchFields;
};

export const buildServiceResourceSearchFields = (
    serviceResourceData: Partial<IServiceResource>,
): ServiceResourceSearchFields => {
    const searchFields: ServiceResourceSearchFields = {};

    if (typeof serviceResourceData.name === "string") {
        searchFields.nameNormalized = normalizeNameSearch(serviceResourceData.name);
    }

    return searchFields;
};

export const buildPrefixSearchRegex = (value: string): RegExp => {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escapedValue}`);
};

export const buildCaseInsensitivePrefixSearchRegex = (value: string): RegExp => {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^${escapedValue}`, "i");
};

export const buildLoosePhoneSearchRegex = (value: string): RegExp => {
    const pattern = value
        .replace(/\D/g, "")
        .split("")
        .map((character) => character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("\\D*");

    return new RegExp(`^\\D*${pattern}`);
};
