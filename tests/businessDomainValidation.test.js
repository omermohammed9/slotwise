const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateCreateBusinessProfile,
    validateBusinessSlugParam,
    validateCreateServiceResource,
    validateCustomerListQuery,
} = require("../dist/middleware/businessDomainValidation");

const createResponse = () => ({
    statusCode: 200,
    jsonPayload: undefined,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(payload) {
        this.jsonPayload = payload;
        return this;
    },
});

const runMiddleware = (middleware, req) => {
    const res = createResponse();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    return { res, nextCalled };
};

test("validateCreateBusinessProfile rejects missing required fields", () => {
    const { res, nextCalled } = runMiddleware(validateCreateBusinessProfile, {
        body: { name: "Slotwise HQ" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Missing required business profile field: slug" },
    });
});

test("validateCreateBusinessProfile accepts template-backed payloads without manual scheduling defaults", () => {
    const { res, nextCalled } = runMiddleware(validateCreateBusinessProfile, {
        body: {
            name: "Template Clinic",
            slug: "template-clinic",
            templateKey: "clinic",
            timezone: "UTC",
            contactEmail: "clinic@example.com",
            contactPhone: "+14155552671",
        },
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("validateCreateServiceResource rejects invalid business ids", () => {
    const { res, nextCalled } = runMiddleware(validateCreateServiceResource, {
        body: {
            businessId: "not-an-id",
            name: "Main Room",
            resourceType: "room",
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "businessId must be a valid object id" },
    });
});

test("validateCustomerListQuery rejects invalid business ids", () => {
    const { res, nextCalled } = runMiddleware(validateCustomerListQuery, {
        query: { businessId: "bad-id" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "businessId must be a valid object id" },
    });
});

test("validateCreateBusinessProfile rejects invalid widget accent colors", () => {
    const { res, nextCalled } = runMiddleware(validateCreateBusinessProfile, {
        body: {
            name: "Widget Business",
            slug: "widget-business",
            businessType: "restaurant",
            timezone: "UTC",
            contactEmail: "widget@example.com",
            contactPhone: "+14155552671",
            availabilityRules: {
                slotIntervalMinutes: 15,
                minAdvanceMinutes: 30,
                maxAdvanceDays: 30,
                bufferBeforeMinutes: 0,
                bufferAfterMinutes: 0,
                allowOverbooking: false,
            },
            workingHours: [],
            notificationSettings: {
                enabledChannels: ["email"],
                reminderLeadHours: [24],
                sendBookingConfirmation: true,
                sendCancellationNotice: true,
                sendRescheduleNotice: true,
            },
            widgetSettings: {
                enabled: true,
                accentColor: "orange",
                embedTitle: "Book Now",
                primaryActionLabel: "Reserve",
                showServiceSelector: true,
                showPartySize: true,
                showNotes: true,
                showBusinessDescription: true,
            },
        },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "widgetSettings.accentColor must be a valid hex color" },
    });
});

test("validateCreateBusinessProfile rejects invalid public booking page logo URLs", () => {
    const req = {
        body: {
            name: "Booking Page Salon",
            slug: "booking-page-salon",
            businessType: "salon",
            timezone: "UTC",
            contactEmail: "salon@example.com",
            contactPhone: "+14155552671",
            availabilityRules: {
                slotIntervalMinutes: 15,
                minAdvanceMinutes: 30,
                maxAdvanceDays: 60,
                bufferBeforeMinutes: 0,
                bufferAfterMinutes: 15,
                allowOverbooking: false,
            },
            workingHours: [],
            notificationSettings: {
                enabledChannels: ["email"],
                reminderLeadHours: [24],
                sendBookingConfirmation: true,
                sendCancellationNotice: true,
                sendRescheduleNotice: true,
            },
            publicPageSettings: {
                enabled: true,
                pageTitle: "Book With Us",
                logoUrl: "ftp://invalid-logo",
                showBusinessDescription: true,
                showAvailableResources: true,
                showContactDetails: true,
                showWorkingHours: true,
                confirmationMessage: "Thanks for booking.",
            },
        },
    };
    const res = createResponse();
    let nextCalled = false;

    validateCreateBusinessProfile(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "publicPageSettings.logoUrl must be a valid http or https URL" },
    });
});

test("validateBusinessSlugParam rejects invalid slugs", () => {
    const { res, nextCalled } = runMiddleware(validateBusinessSlugParam, {
        params: { slug: "Bad Slug" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Invalid business slug" },
    });
});
