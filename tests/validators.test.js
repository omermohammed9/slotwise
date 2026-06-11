const test = require("node:test");
const assert = require("node:assert/strict");

const {
    nameValidator,
    emailValidator,
    phoneValidator,
    futureDateValidator,
    endDateValidator,
} = require("../dist/utils/validators");

test("nameValidator accepts trimmed alphabetic names", () => {
    assert.equal(nameValidator.validator("  Jane Doe  "), true);
    assert.equal(nameValidator.validator("Jane123"), false);
});

test("emailValidator accepts valid addresses and rejects invalid ones", () => {
    assert.equal(emailValidator.validator("jane@example.com"), true);
    assert.equal(emailValidator.validator("not-an-email"), false);
});

test("phoneValidator accepts valid international numbers", () => {
    assert.equal(phoneValidator.validator("+14155552671"), true);
    assert.equal(phoneValidator.validator("12345"), false);
});

test("futureDateValidator rejects past dates", () => {
    assert.equal(futureDateValidator.validator(new Date(Date.now() + 60_000)), true);
    assert.equal(futureDateValidator.validator(new Date(Date.now() - 60_000)), false);
});

test("endDateValidator requires the end date to be after the start date", () => {
    const bookingContext = { startDate: new Date("2030-01-01T00:00:00.000Z") };

    assert.equal(
        endDateValidator.validator.call(bookingContext, new Date("2030-01-02T00:00:00.000Z")),
        true,
    );
    assert.equal(
        endDateValidator.validator.call(bookingContext, new Date("2029-12-31T00:00:00.000Z")),
        false,
    );
});
