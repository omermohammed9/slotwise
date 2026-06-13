const test = require("node:test");
const assert = require("node:assert/strict");

const routerModule = require("../dist/routes/auth.routes");

const router = routerModule.default;

const getRouteMethods = (path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return [...new Set(layers.flatMap((layer) => Object.keys(layer.route.methods)))].sort();
};

test("auth session routes are registered", () => {
    assert.deepEqual(getRouteMethods("/session"), ["delete", "get", "post"]);
    assert.deepEqual(getRouteMethods("/customer/magic-link"), ["post"]);
    assert.deepEqual(getRouteMethods("/customer/verify"), ["post"]);
});
