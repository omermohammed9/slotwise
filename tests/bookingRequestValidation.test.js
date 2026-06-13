const test = require("node:test");
const assert = require("node:assert/strict");

const {
    validateBookingId,
    validateBookingInsightsQuery,
    validateBookingListQuery,
    validateBookingSuggestionsRequest,
    validateCreateBooking,
    validateUpdateBooking,
} = require("../dist/middleware/bookingRequestValidation");

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

test("validateCreateBooking rejects missing required fields", () => {
    const { res, nextCalled } = runMiddleware(validateCreateBooking, {
        body: { fName: "Jane" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Missing required booking field: userId" },
    });
});

test("validateCreateBooking accepts a complete booking payload", () => {
    const { res, nextCalled } = runMiddleware(validateCreateBooking, {
        body: {
            userId: "507f1f77bcf86cd799439011",
            fName: "Jane",
            lName: "Doe",
            gender: "female",
            email: "jane@example.com",
            phone: "+14155552671",
            startDate: "2030-01-02T00:00:00.000Z",
            endDate: "2030-01-03T00:00:00.000Z",
            timein: "2030-01-02T09:00:00.000Z",
            timeout: "2030-01-02T10:00:00.000Z",
        },
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("validateUpdateBooking rejects direct status updates", () => {
    const { res, nextCalled } = runMiddleware(validateUpdateBooking, {
        body: { status: "approved" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Use a booking status action endpoint to change status" },
    });
});

test("validateBookingListQuery rejects unsupported query fields", () => {
    const { res, nextCalled } = runMiddleware(validateBookingListQuery, {
        query: { unknown: "value" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Unsupported booking query field: unknown" },
    });
});

test("validateBookingListQuery rejects unsupported conflictRiskLevel values", () => {
    const { res, nextCalled } = runMiddleware(validateBookingListQuery, {
        query: { conflictRiskLevel: "critical" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Unsupported conflictRiskLevel value" },
    });
});

test("validateBookingId rejects non-object ids", () => {
    const { res, nextCalled } = runMiddleware(validateBookingId, {
        params: { id: "booking-1" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Invalid booking id" },
    });
});

test("validateBookingSuggestionsRequest rejects missing scheduling fields", () => {
    const { res, nextCalled } = runMiddleware(validateBookingSuggestionsRequest, {
        body: { businessId: "507f1f77bcf86cd799439011" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Missing required booking suggestion field: startDate" },
    });
});

test("validateBookingInsightsQuery rejects unsupported query fields", () => {
    const { res, nextCalled } = runMiddleware(validateBookingInsightsQuery, {
        query: { customerId: "507f1f77bcf86cd799439011" },
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Unsupported booking insights query field: customerId" },
    });
});
