const test = require("node:test");
const assert = require("node:assert/strict");

const emailVerifier = require("../dist/utils/emailVerifier");
const bookingModelModule = require("../dist/models/booking.model");
const { BookingService } = require("../dist/services/booking.service");

const bookingModel = bookingModelModule.default;
const service = BookingService.getInstance();

test("updateBooking does not verify email when email is omitted", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    const originalFindByIdAndUpdate = bookingModel.findByIdAndUpdate;
    let verifyCalled = false;
    let receivedUpdate = null;

    emailVerifier.verifyEmail = async () => {
        verifyCalled = true;
        return {
            data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
        };
    };
    bookingModel.findByIdAndUpdate = async (_id, update) => {
        receivedUpdate = update;
        return { _id: "booking-1", ...update };
    };

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
        bookingModel.findByIdAndUpdate = originalFindByIdAndUpdate;
    });

    const updatedBooking = await service.updateBooking("booking-1", { status: "approved" });

    assert.equal(verifyCalled, false);
    assert.equal(receivedUpdate.status, "approved");
    assert.equal(updatedBooking.status, "approved");
});

test("createBooking rejects overlapping bookings before saving", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    const originalCheckAvailability = service.checkAvailability;

    emailVerifier.verifyEmail = async () => ({
        data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
    });
    service.checkAvailability = async () => false;

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
        service.checkAvailability = originalCheckAvailability;
    });

    const bookingData = {
        userId: "507f1f77bcf86cd799439011",
        fName: "Jane",
        lName: "Doe",
        gender: "female",
        email: "jane@example.com",
        phone: "+14155552671",
        startDate: new Date("2030-01-02T00:00:00.000Z"),
        endDate: new Date("2030-01-03T00:00:00.000Z"),
        timein: new Date("2030-01-02T09:00:00.000Z"),
        timeout: new Date("2030-01-03T10:00:00.000Z"),
        status: "pending",
    };

    await assert.rejects(
        async () => service.createBooking(bookingData),
        /The booking slot is not available\./,
    );
});
