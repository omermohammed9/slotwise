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
