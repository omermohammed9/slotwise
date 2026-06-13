const test = require("node:test");
const assert = require("node:assert/strict");

const { BookingController } = require("../dist/controllers/booking.controller");

const createResponse = () => {
    return {
        statusCode: 200,
        jsonPayload: undefined,
        sendPayload: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.jsonPayload = payload;
            return this;
        },
        send(payload) {
            this.sendPayload = payload;
            return this;
        },
    };
};

test("getBookingById returns 404 when the booking does not exist", async () => {
    const controller = new BookingController({
        getBookingById: async () => null,
    });

    const req = { params: { id: "missing-booking" } };
    const res = createResponse();

    await controller.getBookingById(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Booking not found" },
    });
});

test("updateBooking returns 404 when the booking does not exist", async () => {
    const controller = new BookingController({
        updateBooking: async () => null,
    });

    const req = { params: { id: "missing-booking" }, body: { status: "approved" } };
    const res = createResponse();

    await controller.updateBooking(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Booking not found" },
    });
});

test("deleteBooking returns 204 with no body when deletion succeeds", async () => {
    const controller = new BookingController({
        deleteBooking: async () => true,
    });

    const req = { params: { id: "booking-1" } };
    const res = createResponse();

    await controller.deleteBooking(req, res);

    assert.equal(res.statusCode, 204);
    assert.equal(res.sendPayload, undefined);
});

test("approveBooking returns approved booking", async () => {
    let receivedContext = null;
    const controller = new BookingController({
        updateBookingStatus: async (_id, status, context) => {
            receivedContext = context;
            return { _id: "booking-1", status };
        },
    });

    const req = {
        params: { id: "booking-1" },
        body: { reason: "Schedule confirmed" },
        slotwiseSession: {
            actorId: "admin-1",
            username: "admin",
            role: "admin",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    await controller.approveBooking(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.status, "approved");
    assert.deepEqual(receivedContext, {
        changedByRole: "admin",
        changedBy: "admin-1",
        reason: "Schedule confirmed",
    });
});

test("rejectBooking returns 404 when the booking does not exist", async () => {
    const controller = new BookingController({
        updateBookingStatus: async () => null,
    });

    const req = {
        params: { id: "missing-booking" },
        slotwiseSession: {
            actorId: "admin-1",
            username: "admin",
            role: "admin",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    await controller.rejectBooking(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, {
        success: false,
        error: { message: "Booking not found" },
    });
});

test("cancelBooking returns cancelled booking", async () => {
    const controller = new BookingController({
        updateBookingStatus: async (_id, status) => ({ _id: "booking-1", status }),
    });

    const req = {
        params: { id: "booking-1" },
        slotwiseSession: {
            actorId: "admin-1",
            username: "admin",
            role: "admin",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    await controller.cancelBooking(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.status, "cancelled");
});

test("completeBooking returns completed booking", async () => {
    const controller = new BookingController({
        updateBookingStatus: async (_id, status) => ({ _id: "booking-1", status }),
    });

    const req = {
        params: { id: "booking-1" },
        slotwiseSession: {
            actorId: "admin-1",
            username: "admin",
            role: "admin",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    await controller.completeBooking(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.status, "completed");
});

test("getAllBookings returns list data with metadata", async () => {
    const controller = new BookingController({
        getAllBookings: async () => ({
            data: [{ _id: "booking-1" }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            sort: { sortBy: "createdAt", sortOrder: "desc" },
        }),
    });

    const req = { query: {} };
    const res = createResponse();

    await controller.getAllBookings(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.deepEqual(res.jsonPayload.data, [{ _id: "booking-1" }]);
    assert.deepEqual(res.jsonPayload.meta.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
});

test("getBookingSuggestions returns suggestion data with metadata", async () => {
    const controller = new BookingController({
        getBookingSuggestions: async () => ({
            data: [{ timein: "2030-01-02T09:30:00.000Z", score: 96 }],
            meta: {
                maxSuggestions: 3,
                slotIntervalMinutes: 30,
                searchWindowDays: 7,
                requestedTimein: "2030-01-02T09:00:00.000Z",
                requestedTimeout: "2030-01-02T10:00:00.000Z",
            },
        }),
    });

    const req = { body: {} };
    const res = createResponse();

    await controller.getBookingSuggestions(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.deepEqual(res.jsonPayload.data, [{ timein: "2030-01-02T09:30:00.000Z", score: 96 }]);
    assert.equal(res.jsonPayload.meta.slotIntervalMinutes, 30);
});

test("getCancellationNoShowInsights returns analytics payload", async () => {
    const controller = new BookingController({
        getCancellationNoShowInsights: async () => ({
            summary: { totalBookings: 10, cancelledBookings: 2, noShowBookings: 1, completedBookings: 6, cancellationRate: 20, noShowRate: 10, serviceDeliveryRate: 60 },
            trends: { cancellationReasons: [{ reason: "Late change", count: 2 }], noShowReasons: [], byWeekday: [] },
        }),
    });

    const req = { query: {} };
    const res = createResponse();

    await controller.getCancellationNoShowInsights(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.summary.cancelledBookings, 2);
});

test("getBookingDashboardInsights returns dashboard analytics payload", async () => {
    const controller = new BookingController({
        getBookingDashboardInsights: async () => ({
            summary: { totalBookings: 10, approvalRate: 70, conversionRate: 40 },
            funnel: [{ status: "pending", count: 2 }],
            utilization: { byWeekday: [], byResource: [] },
            peaks: { busiestWeekday: "Monday", topTimeSlots: [{ label: "09:00", bookings: 3 }] },
        }),
    });

    const req = { query: {} };
    const res = createResponse();

    await controller.getBookingDashboardInsights(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.summary.totalBookings, 10);
    assert.equal(res.jsonPayload.data.peaks.busiestWeekday, "Monday");
});

test("getBookingTimeline returns timeline data with metadata", async () => {
    const controller = new BookingController({
        getBookingTimeline: async () => ({
            data: [{ date: "2030-01-02", bookings: [{ id: "booking-1" }], summary: { totalBookings: 1 } }],
            meta: { totalTimelineDays: 1, totalBookings: 1 },
        }),
    });

    const req = { query: {} };
    const res = createResponse();

    await controller.getBookingTimeline(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data[0].date, "2030-01-02");
    assert.equal(res.jsonPayload.meta.totalBookings, 1);
});

test("markBookingNoShow returns no_show booking", async () => {
    const controller = new BookingController({
        updateBookingStatus: async (_id, status) => ({ _id: "booking-1", status }),
    });

    const req = {
        params: { id: "booking-1" },
        slotwiseSession: {
            actorId: "staff-1",
            username: "staff",
            role: "staff",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
    };
    const res = createResponse();

    await controller.markBookingNoShow(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonPayload.success, true);
    assert.equal(res.jsonPayload.data.status, "no_show");
});
