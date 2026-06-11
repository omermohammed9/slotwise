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
    const controller = new BookingController();
    controller.bookingService = {
        getBookingById: async () => null,
    };

    const req = { params: { id: "missing-booking" } };
    const res = createResponse();

    await controller.getBookingById(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, { message: "Booking not found" });
});

test("updateBooking returns 404 when the booking does not exist", async () => {
    const controller = new BookingController();
    controller.bookingService = {
        updateBooking: async () => null,
    };

    const req = { params: { id: "missing-booking" }, body: { status: "approved" } };
    const res = createResponse();

    await controller.updateBooking(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.jsonPayload, { message: "Booking not found" });
});

test("deleteBooking returns 204 with no body when deletion succeeds", async () => {
    const controller = new BookingController();
    controller.bookingService = {
        deleteBooking: async () => true,
    };

    const req = { params: { id: "booking-1" } };
    const res = createResponse();

    await controller.deleteBooking(req, res);

    assert.equal(res.statusCode, 204);
    assert.equal(res.sendPayload, undefined);
});
