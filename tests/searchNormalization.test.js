const test = require("node:test");
const assert = require("node:assert/strict");

const {
    buildBookingSearchFields,
    buildCaseInsensitivePrefixSearchRegex,
    buildLoosePhoneSearchRegex,
    buildPrefixSearchRegex,
    normalizeEmailSearch,
    normalizeNameSearch,
    normalizePhoneSearch,
} = require("../dist/utils/searchNormalization");

test("normalizeEmailSearch trims and lowercases emails", () => {
    assert.equal(normalizeEmailSearch("  Jane.Doe@Example.com "), "jane.doe@example.com");
});

test("normalizePhoneSearch removes non-digit characters", () => {
    assert.equal(normalizePhoneSearch("+1 (415) 555-2671"), "14155552671");
});

test("normalizeNameSearch trims and lowercases names", () => {
    assert.equal(normalizeNameSearch("  Jane Doe "), "jane doe");
});

test("buildBookingSearchFields derives normalized values for searchable fields", () => {
    assert.deepEqual(buildBookingSearchFields({
        email: "Jane.Doe@Example.com",
        phone: "+1 (415) 555-2671",
        fName: "Jane",
        lName: "Doe",
    }), {
        emailNormalized: "jane.doe@example.com",
        phoneNormalized: "14155552671",
        fNameNormalized: "jane",
        lNameNormalized: "doe",
    });
});

test("buildPrefixSearchRegex anchors the query prefix", () => {
    const regex = buildPrefixSearchRegex("jane");

    assert.equal(regex.test("jane"), true);
    assert.equal(regex.test("jane-doe"), true);
    assert.equal(regex.test("mary-jane"), false);
});

test("buildCaseInsensitivePrefixSearchRegex matches prefixes without case sensitivity", () => {
    const regex = buildCaseInsensitivePrefixSearchRegex("Jane");

    assert.equal(regex.test("jane@example.com"), true);
    assert.equal(regex.test("JANE DOE"), true);
    assert.equal(regex.test("mary jane"), false);
});

test("buildLoosePhoneSearchRegex matches formatted phone prefixes", () => {
    const regex = buildLoosePhoneSearchRegex("1415");

    assert.equal(regex.test("+1 (415) 555-2671"), true);
    assert.equal(regex.test("14156667777"), true);
    assert.equal(regex.test("+44 20 7946 0958"), false);
});
