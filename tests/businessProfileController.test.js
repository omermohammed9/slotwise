const test = require("node:test");
const assert = require("node:assert/strict");

const { BusinessProfileController } = require("../dist/controllers/business-profile.controller");

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

test("getAllBusinessProfiles forwards the requested business scope", async () => {
    let receivedFilter;
    const controller = new BusinessProfileController({
        getAllBusinessProfiles: async (filter) => {
            receivedFilter = filter;
            return [{ _id: "business-1", name: "North Studio" }];
        },
    });

    const req = { query: { businessId: "business-1" } };
    const res = createResponse();

    await controller.getAllBusinessProfiles(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(receivedFilter, { businessId: "business-1" });
    assert.equal(res.jsonPayload.data[0].name, "North Studio");
});

test("getPublicWidgetConfig returns public widget payload", async () => {
    const controller = new BusinessProfileController({
        getPublicWidgetConfig: async () => ({
            businessId: "business-1",
            slug: "widget-bistro",
            widgetSettings: { enabled: true },
            availableResources: [],
            bookingEndpoints: { createBooking: "/bookings", suggestions: "/bookings/suggestions" },
        }),
    });

    const req = { params: { slug: "widget-bistro" } };
    const res = createResponse();

    await controller.getPublicWidgetConfig(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.slug, "widget-bistro");
});

test("getPublicWidgetConfig returns 404 when widget config is unavailable", async () => {
    const controller = new BusinessProfileController({
        getPublicWidgetConfig: async () => null,
    });

    const req = { params: { slug: "missing-widget" } };
    const res = createResponse();

    await controller.getPublicWidgetConfig(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Public widget configuration not found" },
    });
});

test("getPublicBookingPageConfig returns public booking page payload", async () => {
    const controller = new BusinessProfileController({
        getPublicBookingPageConfig: async () => ({
            businessId: "business-1",
            slug: "public-salon",
            publicPageSettings: { enabled: true, pageTitle: "Book With Us" },
            availableResources: [],
            bookingEndpoints: { createBooking: "/bookings", suggestions: "/bookings/suggestions" },
        }),
    });

    const req = { params: { slug: "public-salon" } };
    const res = createResponse();

    await controller.getPublicBookingPageConfig(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.slug, "public-salon");
});

test("getPublicBookingPageConfig returns 404 when booking page config is unavailable", async () => {
    const controller = new BusinessProfileController({
        getPublicBookingPageConfig: async () => null,
    });

    const req = { params: { slug: "missing-page" } };
    const res = createResponse();

    await controller.getPublicBookingPageConfig(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Public booking page configuration not found" },
    });
});
