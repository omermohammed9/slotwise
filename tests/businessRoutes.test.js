const test = require("node:test");
const assert = require("node:assert/strict");

const businessRouter = require("../dist/routes/business-profile.routes").default;
const customerRouter = require("../dist/routes/customer.routes").default;
const serviceResourceRouter = require("../dist/routes/service-resource.routes").default;

const getRouteMethods = (router, path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return [...new Set(layers.flatMap((layer) => Object.keys(layer.route.methods)))].sort();
};

const getRouteStacks = (router, path) => {
    const layers = router.stack.filter((entry) => entry.route && entry.route.path === path);
    assert.ok(layers.length > 0, `Expected route for path ${path}`);

    return layers.map((layer) => ({
        methods: Object.keys(layer.route.methods).sort(),
        handlers: layer.route.stack.map((entry) => entry.handle.name || "(anonymous)"),
    }));
};

const assertRouteHasHandler = (router, path, method, handlerName) => {
    const route = getRouteStacks(router, path).find((entry) => entry.methods.includes(method));
    assert.ok(route, `Expected ${method.toUpperCase()} ${path}`);
    assert.ok(
        route.handlers.includes(handlerName),
        `Expected ${method.toUpperCase()} ${path} to include ${handlerName}`,
    );
};

test("business profile routes are registered", () => {
    assert.deepEqual(getRouteMethods(businessRouter, "/"), ["get", "post"]);
    assert.deepEqual(getRouteMethods(businessRouter, "/public/:slug/booking-page"), ["get"]);
    assert.deepEqual(getRouteMethods(businessRouter, "/public/:slug/widget"), ["get"]);
    assert.deepEqual(getRouteMethods(businessRouter, "/templates"), ["get"]);
    assert.deepEqual(getRouteMethods(businessRouter, "/templates/:templateKey"), ["get"]);
    assert.deepEqual(getRouteMethods(businessRouter, "/:id"), ["get", "patch"]);
});

test("customer routes are registered", () => {
    assert.deepEqual(getRouteMethods(customerRouter, "/"), ["get", "post"]);
    assert.deepEqual(getRouteMethods(customerRouter, "/:id"), ["get", "patch"]);
});

test("service resource routes are registered", () => {
    assert.deepEqual(getRouteMethods(serviceResourceRouter, "/"), ["get", "post"]);
    assert.deepEqual(getRouteMethods(serviceResourceRouter, "/:id"), ["get", "patch"]);
});

test("business-scoped collection routes require explicit business scope access", () => {
    assertRouteHasHandler(businessRouter, "/", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler(businessRouter, "/:id", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler(businessRouter, "/:id", "patch", "requireBusinessScopeAccess");
    assertRouteHasHandler(customerRouter, "/", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler(customerRouter, "/", "post", "requireBusinessScopeAccess");
    assertRouteHasHandler(serviceResourceRouter, "/", "get", "requireBusinessScopeAccess");
    assertRouteHasHandler(serviceResourceRouter, "/", "post", "requireBusinessScopeAccess");
});
