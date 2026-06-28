const test = require("node:test");
const assert = require("node:assert/strict");

const routerModule = require("../dist/routes/booking.routes");

const router = routerModule.default;

const getRouteMethods = (path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return [...new Set(layers.flatMap((layer) => Object.keys(layer.route.methods)))].sort();
};

const getRouteStacks = (path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return layers.map((layer) => ({
        methods: Object.keys(layer.route.methods).sort(),
        handlers: layer.route.stack.map((entry) => entry.handle.name || "(anonymous)"),
    }));
};

const assertRouteHasHandler = (path, method, handlerName) => {
    const route = getRouteStacks(path).find((entry) => entry.methods.includes(method));
    assert.ok(route, `Expected ${method.toUpperCase()} ${path}`);
    assert.ok(
        route.handlers.includes(handlerName),
        `Expected ${method.toUpperCase()} ${path} to include ${handlerName}`,
    );
};

test("preferred REST aliases are registered", () => {
    assert.deepEqual(getRouteMethods("/"), ["get", "post"]);
    assert.deepEqual(getRouteMethods("/insights/dashboard"), ["get"]);
    assert.deepEqual(getRouteMethods("/insights/cancellation-no-show"), ["get"]);
    assert.deepEqual(getRouteMethods("/timeline"), ["get"]);
    assert.deepEqual(getRouteMethods("/suggestions"), ["post"]);
    assert.deepEqual(getRouteMethods("/:id"), ["delete", "get", "patch", "put"]);
    assert.deepEqual(getRouteMethods("/:id/approve"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/reject"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/cancel"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/complete"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/no-show"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/reschedule"), ["patch"]);
    assert.deepEqual(getRouteMethods("/:id/customer-cancel"), ["post"]);
    assert.deepEqual(getRouteMethods("/:id/customer-reschedule"), ["post"]);
});

test("legacy routes remain registered for backward compatibility", () => {
    assert.deepEqual(getRouteMethods("/createbookings"), ["post"]);
    assert.deepEqual(getRouteMethods("/insights/dashboard"), ["get"]);
    assert.deepEqual(getRouteMethods("/timeline"), ["get"]);
    assert.deepEqual(getRouteMethods("/all"), ["get"]);
    assert.deepEqual(getRouteMethods("/get/:id"), ["get"]);
    assert.deepEqual(getRouteMethods("/update/:id"), ["put"]);
    assert.deepEqual(getRouteMethods("/approve/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/reject/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/cancel/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/complete/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/no-show/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/reschedule/:id"), ["patch"]);
    assert.deepEqual(getRouteMethods("/customer-cancel/:id"), ["post"]);
    assert.deepEqual(getRouteMethods("/customer-reschedule/:id"), ["post"]);
    assert.deepEqual(getRouteMethods("/delete/:id"), ["delete"]);
});

test("business-scoped booking collection and insight routes require explicit business scope access", () => {
    assertRouteHasHandler("/", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler("/all", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler("/timeline", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler("/insights/dashboard", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler("/insights/cancellation-no-show", "get", "requireBusinessScopeAccess");
});
