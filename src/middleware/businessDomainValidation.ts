import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import { sendError } from "../utils/apiResponse";

const businessTypes = ["restaurant", "clinic", "salon", "consulting", "venue", "rental", "fitness", "other"];
const businessStatuses = ["active", "inactive"];
const notificationChannels = ["email", "sms"];
const memberRoles = ["owner", "admin", "staff"];
const serviceResourceTypes = ["service", "staff", "room", "table", "equipment", "appointment", "event"];

const businessCreateRequiredFields = [
    "name",
    "slug",
    "businessType",
    "timezone",
    "contactEmail",
    "contactPhone",
    "availabilityRules",
    "workingHours",
    "notificationSettings",
];
const businessAllowedFields = new Set([
    ...businessCreateRequiredFields,
    "status",
    "description",
    "blackoutDates",
    "members",
    "templateKey",
    "widgetSettings",
    "publicPageSettings",
]);
const serviceResourceCreateRequiredFields = ["businessId", "name", "resourceType"];
const serviceResourceAllowedFields = new Set([
    ...serviceResourceCreateRequiredFields,
    "description",
    "durationMinutes",
    "capacity",
    "active",
    "requiresApproval",
    "supportedRoles",
    "availabilityOverrides",
]);
const customerCreateRequiredFields = ["businessId", "firstName", "lastName", "email", "phone"];
const customerAllowedFields = new Set([
    ...customerCreateRequiredFields,
    "notes",
    "preferredNotificationChannels",
]);
const customerListAllowedFields = new Set(["businessId", "email", "phone", "customerName"]);
const serviceResourceListAllowedFields = new Set(["businessId", "resourceType", "active", "name"]);
const businessSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const validateBusinessDomainId: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return sendError(res, 400, "Invalid id");
    }

    next();
};

export const validateBusinessSlugParam: RequestHandler = (req, res, next) => {
    if (!businessSlugRegex.test(String(req.params.slug))) {
        return sendError(res, 400, "Invalid business slug");
    }

    next();
};

export const validateCreateBusinessProfile: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    const unsupportedField = findUnsupportedField(req.body, businessAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported business profile field: ${unsupportedField}`);
    }

    const requiredFields = req.body.templateKey === undefined
        ? businessCreateRequiredFields
        : ["name", "slug", "timezone", "contactEmail", "contactPhone"];
    const missingField = requiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required business profile field: ${missingField}`);
    }

    const validationError = validateBusinessProfileBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateUpdateBusinessProfile: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    if (Object.keys(req.body).length === 0) {
        return sendError(res, 400, "Business profile update body cannot be empty");
    }

    const unsupportedField = findUnsupportedField(req.body, businessAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported business profile field: ${unsupportedField}`);
    }

    const validationError = validateBusinessProfileBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateCreateServiceResource: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    const unsupportedField = findUnsupportedField(req.body, serviceResourceAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported service resource field: ${unsupportedField}`);
    }

    const missingField = serviceResourceCreateRequiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required service resource field: ${missingField}`);
    }

    const validationError = validateServiceResourceBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateUpdateServiceResource: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    if (Object.keys(req.body).length === 0) {
        return sendError(res, 400, "Service resource update body cannot be empty");
    }

    const unsupportedField = findUnsupportedField(req.body, serviceResourceAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported service resource field: ${unsupportedField}`);
    }

    const validationError = validateServiceResourceBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateServiceResourceListQuery: RequestHandler = (req, res, next) => {
    const unsupportedField = findUnsupportedField(req.query, serviceResourceListAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported service resource query field: ${unsupportedField}`);
    }

    if (req.query.businessId !== undefined && !mongoose.isValidObjectId(String(req.query.businessId))) {
        return sendError(res, 400, "businessId must be a valid object id");
    }

    if (req.query.resourceType !== undefined && !serviceResourceTypes.includes(String(req.query.resourceType))) {
        return sendError(res, 400, "Unsupported service resource type");
    }

    if (req.query.active !== undefined && !["true", "false"].includes(String(req.query.active))) {
        return sendError(res, 400, "active must be true or false");
    }

    next();
};

export const validateCreateCustomer: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    const unsupportedField = findUnsupportedField(req.body, customerAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported customer field: ${unsupportedField}`);
    }

    const missingField = customerCreateRequiredFields.find((field) => req.body[field] === undefined);
    if (missingField) {
        return sendError(res, 400, `Missing required customer field: ${missingField}`);
    }

    const validationError = validateCustomerBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateUpdateCustomer: RequestHandler = (req, res, next) => {
    const bodyError = validateObjectBody(req.body);
    if (bodyError) {
        return sendError(res, 400, bodyError);
    }

    if (Object.keys(req.body).length === 0) {
        return sendError(res, 400, "Customer update body cannot be empty");
    }

    const unsupportedField = findUnsupportedField(req.body, customerAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported customer field: ${unsupportedField}`);
    }

    const validationError = validateCustomerBody(req.body);
    if (validationError) {
        return sendError(res, 400, validationError);
    }

    next();
};

export const validateCustomerListQuery: RequestHandler = (req, res, next) => {
    const unsupportedField = findUnsupportedField(req.query, customerListAllowedFields);
    if (unsupportedField) {
        return sendError(res, 400, `Unsupported customer query field: ${unsupportedField}`);
    }

    if (req.query.businessId !== undefined && !mongoose.isValidObjectId(String(req.query.businessId))) {
        return sendError(res, 400, "businessId must be a valid object id");
    }

    next();
};

const validateObjectBody = (body: unknown): string | null => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Request body must be an object";
    }

    return null;
};

const findUnsupportedField = (source: object, allowedFields: Set<string>): string | null => {
    return Object.keys(source).find((field) => !allowedFields.has(field)) ?? null;
};

const validateBusinessProfileBody = (body: Record<string, unknown>): string | null => {
    if (body.slug !== undefined && !businessSlugRegex.test(String(body.slug))) {
        return "slug must be lowercase kebab-case";
    }

    if (body.businessType !== undefined && !businessTypes.includes(String(body.businessType))) {
        return "Unsupported business type";
    }

    if (
        body.templateKey !== undefined
        && !["restaurant", "clinic", "salon", "consulting", "venue", "rental", "fitness"].includes(String(body.templateKey))
    ) {
        return "Unsupported business template";
    }

    if (body.status !== undefined && !businessStatuses.includes(String(body.status))) {
        return "Unsupported business status";
    }

    if (body.availabilityRules !== undefined) {
        const rules = body.availabilityRules as Record<string, unknown>;
        const requiredRuleFields = [
            "slotIntervalMinutes",
            "minAdvanceMinutes",
            "maxAdvanceDays",
            "bufferBeforeMinutes",
            "bufferAfterMinutes",
            "allowOverbooking",
        ];

        for (const field of requiredRuleFields) {
            if (rules[field] === undefined) {
                return `availabilityRules.${field} is required`;
            }
        }
    }

    if (body.notificationSettings !== undefined) {
        const settings = body.notificationSettings as Record<string, unknown>;
        if (
            settings.enabledChannels !== undefined
            && (
                !Array.isArray(settings.enabledChannels)
                || settings.enabledChannels.some((channel) => !notificationChannels.includes(String(channel)))
            )
        ) {
            return "notificationSettings.enabledChannels contains an unsupported value";
        }
    }

    if (body.widgetSettings !== undefined) {
        if (!isPlainObject(body.widgetSettings)) {
            return "widgetSettings must be an object";
        }

        const widgetSettings = body.widgetSettings as Record<string, unknown>;
        if (widgetSettings.accentColor !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(String(widgetSettings.accentColor))) {
            return "widgetSettings.accentColor must be a valid hex color";
        }
    }

    if (body.publicPageSettings !== undefined) {
        if (!isPlainObject(body.publicPageSettings)) {
            return "publicPageSettings must be an object";
        }

        const publicPageSettings = body.publicPageSettings as Record<string, unknown>;
        if (publicPageSettings.logoUrl !== undefined && !isValidHttpUrl(String(publicPageSettings.logoUrl))) {
            return "publicPageSettings.logoUrl must be a valid http or https URL";
        }

        if (publicPageSettings.coverImageUrl !== undefined && !isValidHttpUrl(String(publicPageSettings.coverImageUrl))) {
            return "publicPageSettings.coverImageUrl must be a valid http or https URL";
        }
    }

    if (body.members !== undefined) {
        if (!Array.isArray(body.members)) {
            return "members must be an array";
        }

        const invalidMember = body.members.find((member) => {
            const candidate = member as Record<string, unknown>;
            return !memberRoles.includes(String(candidate.role));
        });
        if (invalidMember) {
            return "members contains an unsupported role";
        }
    }

    if (body.blackoutDates !== undefined && !hasValidDateRangeArray(body.blackoutDates)) {
        return "blackoutDates must contain valid date ranges";
    }

    return null;
};

const validateServiceResourceBody = (body: Record<string, unknown>): string | null => {
    if (body.businessId !== undefined && !mongoose.isValidObjectId(String(body.businessId))) {
        return "businessId must be a valid object id";
    }

    if (body.resourceType !== undefined && !serviceResourceTypes.includes(String(body.resourceType))) {
        return "Unsupported service resource type";
    }

    if (body.supportedRoles !== undefined) {
        if (!Array.isArray(body.supportedRoles)) {
            return "supportedRoles must be an array";
        }

        if (body.supportedRoles.some((role) => !memberRoles.includes(String(role)))) {
            return "supportedRoles contains an unsupported role";
        }
    }

    if (
        body.availabilityOverrides !== undefined
        && !isPlainObject(body.availabilityOverrides)
    ) {
        return "availabilityOverrides must be an object";
    }

    return null;
};

const validateCustomerBody = (body: Record<string, unknown>): string | null => {
    if (body.businessId !== undefined && !mongoose.isValidObjectId(String(body.businessId))) {
        return "businessId must be a valid object id";
    }

    if (body.preferredNotificationChannels !== undefined) {
        if (!Array.isArray(body.preferredNotificationChannels)) {
            return "preferredNotificationChannels must be an array";
        }

        if (body.preferredNotificationChannels.some((channel) => !notificationChannels.includes(String(channel)))) {
            return "preferredNotificationChannels contains an unsupported value";
        }
    }

    return null;
};

const hasValidDateRangeArray = (value: unknown): boolean => {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.every((item) => {
        if (!isPlainObject(item)) {
            return false;
        }

        const candidate = item as Record<string, unknown>;
        if (candidate.startDate === undefined || candidate.endDate === undefined) {
            return false;
        }

        const startDate = new Date(String(candidate.startDate));
        const endDate = new Date(String(candidate.endDate));
        return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate > startDate;
    });
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    typeof value === "object" && value !== null && !Array.isArray(value)
);

const isValidHttpUrl = (value: string): boolean => {
    try {
        const parsedUrl = new URL(value);
        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
        return false;
    }
};
