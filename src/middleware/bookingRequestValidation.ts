import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import { BookingStatus } from "../interfaces/booking.interface";
import { sendError } from "../utils/apiResponse";

const bookingStatuses: BookingStatus[] = ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'];
const createRequiredFields = [
    'userId',
    'fName',
    'lName',
    'gender',
    'email',
    'phone',
    'startDate',
    'endDate',
    'timein',
    'timeout',
];
const createAllowedFields = new Set([
    ...createRequiredFields,
    'status',
    'businessId',
    'customerId',
    'serviceResourceId',
    'partySize',
    'notes',
]);
const updateAllowedFields = new Set([
    'userId',
    'businessId',
    'customerId',
    'serviceResourceId',
    'fName',
    'lName',
    'gender',
    'email',
    'phone',
    'partySize',
    'notes',
    'startDate',
    'endDate',
    'timein',
    'timeout',
]);
const listAllowedQueryFields = new Set([
    'status',
    'conflictRiskLevel',
    'startDateFrom',
    'startDateTo',
    'businessId',
    'customerId',
    'serviceResourceId',
    'email',
    'phone',
    'customerName',
    'page',
    'limit',
    'sortBy',
    'sortOrder',
]);
const suggestionAllowedFields = new Set([
    'businessId',
    'serviceResourceId',
    'partySize',
    'startDate',
    'endDate',
    'timein',
    'timeout',
    'maxSuggestions',
]);
const insightsAllowedQueryFields = new Set([
    'startDateFrom',
    'startDateTo',
    'businessId',
    'serviceResourceId',
]);
const sortFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'status'];
const sortOrders = ['asc', 'desc'];

export const validateBookingId: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return sendError(res, 400, 'Invalid booking id');
    }

    next();
};

export const validateCreateBooking: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const bodyValidationError = validateObjectBody(req.body);
    if (bodyValidationError) {
        return sendError(res, 400, bodyValidationError);
    }

    const unsupportedField = findUnsupportedField(req.body, createAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking field: ${unsupportedField}`);
    }

    const missingField = createRequiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required booking field: ${missingField}`);
    }

    const dateValidationError = validateBookingDates(req.body);
    if (dateValidationError) {
        return sendError(res, 400, dateValidationError);
    }

    if (req.body.status !== undefined && !bookingStatuses.includes(req.body.status)) {
        return sendError(res, 400, 'Unsupported booking status');
    }

    const businessFieldError = validateOptionalObjectIdFields(req.body, ['userId', 'businessId', 'customerId', 'serviceResourceId']);
    if (businessFieldError) {
        return sendError(res, 400, businessFieldError);
    }

    const partySizeError = validateOptionalPartySize(req.body.partySize);
    if (partySizeError) {
        return sendError(res, 400, partySizeError);
    }

    next();
};

export const validateUpdateBooking: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const bodyValidationError = validateObjectBody(req.body);
    if (bodyValidationError) {
        return sendError(res, 400, bodyValidationError);
    }

    if (Object.keys(req.body).length === 0) {
        return sendError(res, 400, 'Booking update body cannot be empty');
    }

    if (req.body.status !== undefined) {
        return sendError(res, 400, 'Use a booking status action endpoint to change status');
    }

    const unsupportedField = findUnsupportedField(req.body, updateAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking field: ${unsupportedField}`);
    }

    const dateValidationError = validateBookingDates(req.body);
    if (dateValidationError) {
        return sendError(res, 400, dateValidationError);
    }

    const businessFieldError = validateOptionalObjectIdFields(req.body, ['userId', 'businessId', 'customerId', 'serviceResourceId']);
    if (businessFieldError) {
        return sendError(res, 400, businessFieldError);
    }

    const partySizeError = validateOptionalPartySize(req.body.partySize);
    if (partySizeError) {
        return sendError(res, 400, partySizeError);
    }

    next();
};

export const validateBookingListQuery: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const unsupportedField = findUnsupportedField(req.query, listAllowedQueryFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking query field: ${unsupportedField}`);
    }

    if (req.query.status !== undefined && !bookingStatuses.includes(String(req.query.status) as BookingStatus)) {
        return sendError(res, 400, 'Unsupported booking status filter');
    }

    if (req.query.conflictRiskLevel !== undefined && !['low', 'medium', 'high'].includes(String(req.query.conflictRiskLevel))) {
        return sendError(res, 400, 'Unsupported conflictRiskLevel value');
    }

    const dateFields = ['startDateFrom', 'startDateTo'];
    for (const field of dateFields) {
        if (req.query[field] !== undefined && Number.isNaN(new Date(String(req.query[field])).getTime())) {
            return sendError(res, 400, `${field} must be a valid date`);
        }
    }

    const objectIdFields = ['businessId', 'customerId', 'serviceResourceId'];
    for (const field of objectIdFields) {
        if (req.query[field] !== undefined && !mongoose.isValidObjectId(String(req.query[field]))) {
            return sendError(res, 400, `${field} must be a valid object id`);
        }
    }

    const pageError = validatePositiveIntegerQuery(req.query.page, 'page');
    if (pageError) {
        return sendError(res, 400, pageError);
    }

    const limitError = validatePositiveIntegerQuery(req.query.limit, 'limit');
    if (limitError) {
        return sendError(res, 400, limitError);
    }

    if (req.query.sortBy !== undefined && !sortFields.includes(String(req.query.sortBy))) {
        return sendError(res, 400, 'Unsupported sortBy value');
    }

    if (req.query.sortOrder !== undefined && !sortOrders.includes(String(req.query.sortOrder))) {
        return sendError(res, 400, 'Unsupported sortOrder value');
    }

    next();
};

export const validateBookingSuggestionsRequest: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const bodyValidationError = validateObjectBody(req.body);
    if (bodyValidationError) {
        return sendError(res, 400, bodyValidationError);
    }

    const unsupportedField = findUnsupportedField(req.body, suggestionAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking field: ${unsupportedField}`);
    }

    const requiredFields = ['startDate', 'endDate', 'timein', 'timeout'];
    const missingField = requiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required booking suggestion field: ${missingField}`);
    }

    const dateValidationError = validateBookingDates(req.body);
    if (dateValidationError) {
        return sendError(res, 400, dateValidationError);
    }

    const objectIdFieldError = validateOptionalObjectIdFields(req.body, ['businessId', 'serviceResourceId']);
    if (objectIdFieldError) {
        return sendError(res, 400, objectIdFieldError);
    }

    const partySizeError = validateOptionalPartySize(req.body.partySize);
    if (partySizeError) {
        return sendError(res, 400, partySizeError);
    }

    const suggestionCountError = validatePositiveIntegerValue(req.body.maxSuggestions, 'maxSuggestions');
    if (suggestionCountError) {
        return sendError(res, 400, suggestionCountError);
    }

    next();
};

export const validateBookingInsightsQuery: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const unsupportedField = findUnsupportedField(req.query, insightsAllowedQueryFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking insights query field: ${unsupportedField}`);
    }

    const dateFields = ['startDateFrom', 'startDateTo'];
    for (const field of dateFields) {
        if (req.query[field] !== undefined && Number.isNaN(new Date(String(req.query[field])).getTime())) {
            return sendError(res, 400, `${field} must be a valid date`);
        }
    }

    const objectIdFields = ['businessId', 'serviceResourceId'];
    for (const field of objectIdFields) {
        if (req.query[field] !== undefined && !mongoose.isValidObjectId(String(req.query[field]))) {
            return sendError(res, 400, `${field} must be a valid object id`);
        }
    }

    next();
};

export const validateRescheduleBooking: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const bodyValidationError = validateObjectBody(req.body);
    if (bodyValidationError) {
        return sendError(res, 400, bodyValidationError);
    }

    const requiredFields = ["startDate", "endDate", "timein", "timeout"];
    const missingField = requiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required reschedule field: ${missingField}`);
    }

    const unsupportedField = findUnsupportedField(req.body, new Set([...requiredFields, "reason", "email"]));
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking field: ${unsupportedField}`);
    }

    const dateValidationError = validateBookingDates(req.body);
    if (dateValidationError) {
        return sendError(res, 400, dateValidationError);
    }

    next();
};

export const validateCustomerBookingAction: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const bodyValidationError = validateObjectBody(req.body);
    if (bodyValidationError) {
        return sendError(res, 400, bodyValidationError);
    }

    const unsupportedField = findUnsupportedField(req.body, new Set(["reason"]));
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported booking field: ${unsupportedField}`);
    }

    next();
};

const validateObjectBody = (body: unknown): string | null => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return 'Request body must be an object';
    }

    return null;
};

const findUnsupportedField = (source: object, allowedFields: Set<string>): string | null => {
    return Object.keys(source).find((field) => !allowedFields.has(field)) ?? null;
};

const validateBookingDates = (body: Record<string, unknown>): string | null => {
    const startDate = parseOptionalDate(body.startDate);
    const endDate = parseOptionalDate(body.endDate);
    const timein = parseOptionalDate(body.timein);
    const timeout = parseOptionalDate(body.timeout);

    if (body.startDate !== undefined && !startDate) {
        return 'startDate must be a valid date';
    }

    if (body.endDate !== undefined && !endDate) {
        return 'endDate must be a valid date';
    }

    if (body.timein !== undefined && !timein) {
        return 'timein must be a valid date';
    }

    if (body.timeout !== undefined && !timeout) {
        return 'timeout must be a valid date';
    }

    if (startDate && endDate && endDate <= startDate) {
        return 'endDate must be after startDate';
    }

    if (timein && timeout && timeout <= timein) {
        return 'timeout must be after timein';
    }

    return null;
};

const parseOptionalDate = (value: unknown): Date | null => {
    if (value === undefined) {
        return null;
    }

    const parsedDate = new Date(String(value));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const validatePositiveIntegerQuery = (value: unknown, fieldName: string): string | null => {
    if (value === undefined) {
        return null;
    }

    return validatePositiveIntegerValue(value, fieldName);
};

const validatePositiveIntegerValue = (value: unknown, fieldName: string): string | null => {
    if (value === undefined) {
        return null;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return `${fieldName} must be a positive integer`;
    }

    return null;
};

const validateOptionalObjectIdFields = (body: Record<string, unknown>, fields: string[]): string | null => {
    for (const field of fields) {
        if (body[field] !== undefined && !mongoose.isValidObjectId(String(body[field]))) {
            return `${field} must be a valid object id`;
        }
    }

    return null;
};

const validateOptionalPartySize = (value: unknown): string | null => {
    if (value === undefined) {
        return null;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return 'partySize must be a positive integer';
    }

    return null;
};
