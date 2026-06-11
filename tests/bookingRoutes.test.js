const test = require("node:test");
const assert = require("node:assert/strict");

const routerModule = require("../dist/routes/booking.routes");

const router = routerModule.default;

const getRouteMethods = (path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return [...new Set(layers.flatMap((layer) => Object.keys(layer.route.methods)))].sort();
};

test("preferred REST aliases are registered", () => {
    assert.deepEqual(getRouteMethods("/"), ["get", "post"]);
    assert.deepEqual(getRouteMethods("/:id"), ["delete", "get", "patch", "put"]);
});

test("legacy routes remain registered for backward compatibility", () => {
    assert.deepEqual(getRouteMethods("/createbookings"), ["post"]);
    assert.deepEqual(getRouteMethods("/all"), ["get"]);
    assert.deepEqual(getRouteMethods("/get/:id"), ["get"]);
    assert.deepEqual(getRouteMethods("/update/:id"), ["put"]);
    assert.deepEqual(getRouteMethods("/delete/:id"), ["delete"]);
});
