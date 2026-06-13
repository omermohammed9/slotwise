const test = require("node:test");
const assert = require("node:assert/strict");

const { BusinessProfileService } = require("../dist/services/business-profile.service");

test("createBusinessProfile applies the selected template defaults", async () => {
    let receivedProfileData = null;
    const service = new BusinessProfileService({
        create: async (profileData) => {
            receivedProfileData = profileData;
            return { _id: "business-1", ...profileData };
        },
        findAll: async () => [],
        findById: async () => null,
        findActiveById: async () => null,
        updateById: async () => null,
    });

    const createdProfile = await service.createBusinessProfile({
        name: "Template Clinic",
        slug: "template-clinic",
        templateKey: "clinic",
        timezone: "UTC",
        contactEmail: "clinic@example.com",
        contactPhone: "+14155552671",
    });

    assert.equal(receivedProfileData.businessType, "clinic");
    assert.equal(receivedProfileData.availabilityRules.slotIntervalMinutes, 30);
    assert.equal(receivedProfileData.notificationSettings.enabledChannels.includes("sms"), true);
    assert.equal(receivedProfileData.publicPageSettings.pageTitle, "Book a Clinic Appointment");
    assert.equal(createdProfile.templateKey, "clinic");
});

test("updateBusinessProfile lets explicit overrides win over template defaults", async () => {
    let receivedProfileData = null;
    const service = new BusinessProfileService({
        create: async () => null,
        findAll: async () => [],
        findById: async () => null,
        findActiveById: async () => null,
        updateById: async (_id, profileData) => {
            receivedProfileData = profileData;
            return { _id: "business-1", ...profileData };
        },
    });

    const updatedProfile = await service.updateBusinessProfile("business-1", {
        templateKey: "restaurant",
        availabilityRules: {
            slotIntervalMinutes: 20,
            minAdvanceMinutes: 30,
            maxAdvanceDays: 14,
            bufferBeforeMinutes: 0,
            bufferAfterMinutes: 5,
            allowOverbooking: false,
        },
        notificationSettings: {
            enabledChannels: ["email"],
            reminderLeadHours: [2],
            sendBookingConfirmation: true,
            sendCancellationNotice: false,
            sendRescheduleNotice: true,
        },
    });

    assert.equal(receivedProfileData.businessType, "restaurant");
    assert.equal(receivedProfileData.availabilityRules.slotIntervalMinutes, 20);
    assert.deepEqual(receivedProfileData.notificationSettings.reminderLeadHours, [2]);
    assert.equal(receivedProfileData.publicPageSettings.pageTitle, "Reserve a Table at Our Restaurant");
    assert.equal(updatedProfile.templateKey, "restaurant");
});

test("getBusinessTemplateByKey returns the selected preset", () => {
    const service = new BusinessProfileService({
        create: async () => null,
        findAll: async () => [],
        findById: async () => null,
        findActiveById: async () => null,
        updateById: async () => null,
    });

    const template = service.getBusinessTemplateByKey("venue");

    assert.equal(template.key, "venue");
    assert.equal(template.suggestedResources.length > 0, true);
});

test("getPublicWidgetConfig returns active business widget settings and active resources", async () => {
    const service = new BusinessProfileService(
        {
            create: async () => null,
            findAll: async () => [],
            findById: async () => null,
            findBySlug: async () => null,
            findActiveById: async () => null,
            findActiveBySlug: async () => ({
                _id: "business-1",
                name: "Widget Bistro",
                slug: "widget-bistro",
                businessType: "restaurant",
                timezone: "UTC",
                description: "A polished dining experience.",
                widgetSettings: {
                    enabled: true,
                    accentColor: "#B85C38",
                    embedTitle: "Reserve Your Table",
                    primaryActionLabel: "Book Table",
                    showServiceSelector: true,
                    showPartySize: true,
                    showNotes: true,
                    showBusinessDescription: true,
                },
            }),
            updateById: async () => null,
        },
        {
            findAll: async () => ([
                {
                    _id: "resource-1",
                    name: "Main Dining Tables",
                    resourceType: "table",
                    capacity: 4,
                    requiresApproval: false,
                },
            ]),
            findById: async () => null,
            create: async () => null,
            updateById: async () => null,
        },
    );

    const config = await service.getPublicWidgetConfig("widget-bistro");

    assert.equal(config.slug, "widget-bistro");
    assert.equal(config.widgetSettings.enabled, true);
    assert.equal(config.availableResources.length, 1);
    assert.equal(config.availableResources[0].name, "Main Dining Tables");
    assert.equal(config.bookingEndpoints.createBooking, "/bookings");
});

test("getPublicBookingPageConfig returns page customization and respects visibility settings", async () => {
    const service = new BusinessProfileService(
        {
            create: async () => null,
            findAll: async () => [],
            findById: async () => null,
            findBySlug: async () => null,
            findActiveById: async () => null,
            findActiveBySlug: async () => ({
                _id: "business-2",
                name: "Public Salon",
                slug: "public-salon",
                businessType: "salon",
                timezone: "UTC",
                description: "A bright and modern salon.",
                contactEmail: "hello@salon.example.com",
                contactPhone: "+14155552671",
                workingHours: [{ dayOfWeek: 1, startTime: "09:00", endTime: "18:00", closed: false }],
                widgetSettings: {
                    enabled: true,
                    accentColor: "#C46A5D",
                    embedTitle: "Book a Salon Session",
                    primaryActionLabel: "Reserve Session",
                    showServiceSelector: true,
                    showPartySize: false,
                    showNotes: true,
                    showBusinessDescription: true,
                },
                publicPageSettings: {
                    enabled: true,
                    pageTitle: "Reserve Your Visit",
                    heroMessage: "Choose your ideal slot.",
                    showBusinessDescription: true,
                    showAvailableResources: false,
                    showContactDetails: true,
                    showWorkingHours: true,
                    confirmationMessage: "We have received your request.",
                },
            }),
            updateById: async () => null,
        },
        {
            findAll: async () => {
                throw new Error("Resource lookup should not run when resources are hidden");
            },
            findById: async () => null,
            create: async () => null,
            updateById: async () => null,
        },
    );

    const config = await service.getPublicBookingPageConfig("public-salon");

    assert.equal(config.slug, "public-salon");
    assert.equal(config.publicPageSettings.pageTitle, "Reserve Your Visit");
    assert.equal(config.contactDetails.email, "hello@salon.example.com");
    assert.equal(config.workingHours.length, 1);
    assert.equal(config.availableResources.length, 0);
    assert.equal(config.widgetSettings.accentColor, "#C46A5D");
});
