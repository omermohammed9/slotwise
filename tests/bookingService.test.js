const test = require("node:test");
const assert = require("node:assert/strict");

const emailVerifier = require("../dist/utils/emailVerifier");
const { BookingService } = require("../dist/services/booking.service");

const createRepositoryStub = (overrides = {}) => ({
    findOverlapping: async () => null,
    create: async (bookingData) => ({ _id: "booking-1", ...bookingData }),
    findAll: async () => ({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        sort: { sortBy: "createdAt", sortOrder: "desc" },
    }),
    findById: async () => null,
    updateById: async (_id, update) => ({ _id: "booking-1", ...update }),
    updateStatusById: async (_id, status, auditEntries) => ({
        _id: "booking-1",
        status,
        statusHistory: auditEntries,
    }),
    getConflictRiskContext: async () => ({
        adjacentBookingCount: 0,
        minimumGapMinutes: null,
        sameDayActiveBookingCount: 0,
    }),
    findInsightsSource: async () => [],
    deleteById: async () => true,
    ...overrides,
});

const statusChangeContext = {
    changedByRole: "admin",
    changedBy: "admin-1",
    reason: "Schedule confirmed",
};

test("updateBooking does not verify email when email is omitted", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    let verifyCalled = false;
    let receivedUpdate = null;
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({
            _id: "booking-1",
            userId: "507f1f77bcf86cd799439011",
            fName: "Jane",
            lName: "Doe",
            gender: "female",
            email: "jane@example.com",
            phone: "+14155552671",
            startDate: new Date("2030-01-02T00:00:00.000Z"),
            endDate: new Date("2030-01-03T00:00:00.000Z"),
            timein: new Date("2030-01-02T09:00:00.000Z"),
            timeout: new Date("2030-01-02T10:00:00.000Z"),
            status: "pending",
            toObject() {
                return { ...this };
            },
        }),
        updateById: async (_id, update) => {
            receivedUpdate = update;
            return { _id: "booking-1", ...update };
        },
    }));

    emailVerifier.verifyEmail = async () => {
        verifyCalled = true;
        return {
            data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
        };
    };

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
    });

    const updatedBooking = await service.updateBooking("booking-1", { status: "approved" });

    assert.equal(verifyCalled, false);
    assert.equal(receivedUpdate.status, "approved");
    assert.equal(updatedBooking.status, "approved");
});

test("createBooking rejects overlapping bookings before saving", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    const service = new BookingService(createRepositoryStub({
        findOverlapping: async () => ({ _id: "overlap-booking" }),
    }));

    emailVerifier.verifyEmail = async () => ({
        data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
    });

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
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

test("checkAvailability uses date and time boundaries", async () => {
    const expectedStartDate = new Date("2030-01-02T00:00:00.000Z");
    const expectedEndDate = new Date("2030-01-02T23:59:59.000Z");
    const expectedTimeIn = new Date("2030-01-02T09:00:00.000Z");
    const expectedTimeOut = new Date("2030-01-02T10:00:00.000Z");
    let receivedArguments = null;
    const service = new BookingService(createRepositoryStub({
        findOverlapping: async (...args) => {
            receivedArguments = args;
            return null;
        },
    }));

    const isAvailable = await service.checkAvailability(
        expectedStartDate,
        expectedEndDate,
        expectedTimeIn,
        expectedTimeOut,
    );

    assert.equal(isAvailable, true);
    assert.deepEqual(receivedArguments, [
        expectedStartDate,
        expectedEndDate,
        expectedTimeIn,
        expectedTimeOut,
        {},
    ]);
});

test("updateBookingStatus updates only the booking status", async () => {
    let receivedStatus = null;
    let receivedAuditEntries = null;
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({ _id: "booking-1", status: "pending", statusHistory: [] }),
        updateStatusById: async (_id, status, auditEntries) => {
            receivedStatus = status;
            receivedAuditEntries = auditEntries;
            return { _id: "booking-1", status, statusHistory: auditEntries };
        },
    }));

    const updatedBooking = await service.updateBookingStatus("booking-1", "approved", statusChangeContext);

    assert.equal(receivedStatus, "approved");
    assert.equal(receivedAuditEntries.length, 2);
    assert.equal(receivedAuditEntries[0].fromStatus, "pending");
    assert.equal(receivedAuditEntries[0].toStatus, "pending");
    assert.equal(receivedAuditEntries[0].changedByRole, "system");
    assert.equal(receivedAuditEntries[0].reason, "Backfilled legacy booking status history");
    assert.equal(receivedAuditEntries[1].fromStatus, "pending");
    assert.equal(receivedAuditEntries[1].toStatus, "approved");
    assert.equal(receivedAuditEntries[1].changedByRole, "admin");
    assert.equal(receivedAuditEntries[1].changedBy, "admin-1");
    assert.equal(receivedAuditEntries[1].reason, "Schedule confirmed");
    assert.ok(receivedAuditEntries[1].changedAt instanceof Date);
    assert.equal(updatedBooking.status, "approved");
});

test("updateBookingStatus rejects invalid lifecycle transitions", async () => {
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({ _id: "booking-1", status: "completed" }),
    }));

    await assert.rejects(
        async () => service.updateBookingStatus("booking-1", "approved", statusChangeContext),
        /Cannot change booking status from completed to approved/,
    );
});

test("updateBookingStatus allows approved bookings to complete", async () => {
    let receivedStatus = null;
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({ _id: "booking-1", status: "approved", statusHistory: [{ fromStatus: "approved", toStatus: "approved" }] }),
        updateStatusById: async (_id, status) => {
            receivedStatus = status;
            return { _id: "booking-1", status };
        },
    }));

    const updatedBooking = await service.updateBookingStatus("booking-1", "completed", statusChangeContext);

    assert.equal(receivedStatus, "completed");
    assert.equal(updatedBooking.status, "completed");
});

test("updateBookingStatus allows approved bookings to become no_show", async () => {
    let receivedStatus = null;
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({ _id: "booking-1", status: "approved", statusHistory: [{ fromStatus: "approved", toStatus: "approved" }] }),
        updateStatusById: async (_id, status) => {
            receivedStatus = status;
            return { _id: "booking-1", status };
        },
    }));

    const updatedBooking = await service.updateBookingStatus("booking-1", "no_show", statusChangeContext);

    assert.equal(receivedStatus, "no_show");
    assert.equal(updatedBooking.status, "no_show");
});

test("getBookingById backfills a legacy statusHistory entry when missing", async () => {
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({
            _id: "booking-1",
            status: "approved",
            createdAt: new Date("2030-01-01T00:00:00.000Z"),
            statusHistory: [],
        }),
    }));

    const booking = await service.getBookingById("booking-1");

    assert.equal(booking.statusHistory.length, 1);
    assert.equal(booking.statusHistory[0].changedByRole, "system");
    assert.equal(booking.statusHistory[0].reason, "Backfilled legacy booking status history");
    assert.equal(booking.statusHistory[0].toStatus, "approved");
    assert.equal(booking.conflictRisk.level, "low");
    assert.equal(booking.conflictRisk.score, 0);
});

test("createBooking seeds initial statusHistory when none is provided", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    let receivedBookingData = null;
    const service = new BookingService(createRepositoryStub({
        create: async (bookingData) => {
            receivedBookingData = bookingData;
            return { _id: "booking-1", ...bookingData };
        },
    }));

    emailVerifier.verifyEmail = async () => ({
        data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
    });

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
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

    const createdBooking = await service.createBooking(bookingData);

    assert.equal(receivedBookingData.statusHistory.length, 1);
    assert.equal(receivedBookingData.statusHistory[0].changedByRole, "system");
    assert.equal(receivedBookingData.statusHistory[0].reason, "Initial booking status recorded");
    assert.equal(receivedBookingData.conflictRisk.level, "low");
    assert.equal(createdBooking.statusHistory.length, 1);
});

test("getAllBookings forwards filters, pagination, and sorting", async () => {
    let receivedFilters = null;
    let receivedOptions = null;
    const service = new BookingService(createRepositoryStub({
        findAll: async (filters, options) => {
            receivedFilters = filters;
            receivedOptions = options;
            return {
                data: [],
                pagination: { page: options.page, limit: options.limit, total: 0, totalPages: 0 },
                sort: { sortBy: options.sortBy, sortOrder: options.sortOrder },
            };
        },
    }));

    const result = await service.getAllBookings({
        status: "approved",
        conflictRiskLevel: "medium",
        startDateFrom: "2030-01-01T00:00:00.000Z",
        startDateTo: "2030-01-31T00:00:00.000Z",
        email: "jane@example.com",
        phone: "+14155552671",
        customerName: "Jane",
        page: "2",
        limit: "10",
        sortBy: "startDate",
        sortOrder: "asc",
    });

    assert.equal(receivedFilters.status, "approved");
    assert.equal(receivedFilters.conflictRiskLevel, "medium");
    assert.deepEqual(receivedFilters.startDateFrom, new Date("2030-01-01T00:00:00.000Z"));
    assert.deepEqual(receivedFilters.startDateTo, new Date("2030-01-31T00:00:00.000Z"));
    assert.equal(receivedFilters.email, "jane@example.com");
    assert.equal(receivedFilters.phone, "+14155552671");
    assert.equal(receivedFilters.customerName, "Jane");
    assert.deepEqual(receivedOptions, {
        page: 2,
        limit: 10,
        sortBy: "startDate",
        sortOrder: "asc",
    });
    assert.equal(result.pagination.page, 2);
});

test("getAllBookings rejects unsupported list query values", async () => {
    const service = new BookingService(createRepositoryStub());

    await assert.rejects(
        async () => service.getAllBookings({ status: "archived" }),
        /Invalid booking list query: status is not supported/,
    );

    await assert.rejects(
        async () => service.getAllBookings({ page: "0" }),
        /Invalid booking list query: page must be a positive integer/,
    );
});

test("createBooking links a business-scoped customer and plans notifications", async (t) => {
    const originalVerifyEmail = emailVerifier.verifyEmail;
    let receivedAvailabilityContext = null;
    let receivedCreatedBooking = null;
    let incrementPayload = null;
    const bookingRepository = createRepositoryStub({
        findOverlapping: async (_startDate, _endDate, _timein, _timeout, context) => {
            receivedAvailabilityContext = context;
            return null;
        },
        create: async (bookingData) => {
            receivedCreatedBooking = bookingData;
            return { _id: "booking-1", ...bookingData };
        },
    });
    const businessProfileRepository = {
        findActiveById: async () => ({
            _id: "business-1",
            timezone: "UTC",
            blackoutDates: [],
            workingHours: [{ dayOfWeek: 3, startTime: "09:00", endTime: "18:00", closed: false }],
            availabilityRules: {
                slotIntervalMinutes: 30,
                minAdvanceMinutes: 0,
                maxAdvanceDays: 2000,
                bufferBeforeMinutes: 15,
                bufferAfterMinutes: 10,
                allowOverbooking: false,
            },
            notificationSettings: {
                enabledChannels: ["email"],
                reminderLeadHours: [24],
                sendBookingConfirmation: true,
                sendCancellationNotice: true,
                sendRescheduleNotice: true,
            },
        }),
        findById: async () => null,
    };
    const serviceResourceRepository = {
        findById: async () => ({
            _id: "resource-1",
            businessId: "business-1",
            active: true,
            capacity: 4,
            availabilityOverrides: {
                bufferBeforeMinutes: 15,
                bufferAfterMinutes: 10,
            },
        }),
    };
    const customerRepository = {
        findById: async () => null,
        upsertFromBooking: async () => ({ _id: "customer-1", preferredNotificationChannels: ["email"] }),
        incrementBookingCount: async (customerId, bookingDate) => {
            incrementPayload = { customerId, bookingDate };
        },
    };
    const notificationJobRepository = {
        async create() {},
    };
    const service = new BookingService(
        bookingRepository,
        businessProfileRepository,
        serviceResourceRepository,
        customerRepository,
        notificationJobRepository,
    );

    emailVerifier.verifyEmail = async () => ({
        data: { result: "deliverable", status: "valid", score: 100, email: "jane@example.com" },
    });

    t.after(() => {
        emailVerifier.verifyEmail = originalVerifyEmail;
    });

    const createdBooking = await service.createBooking({
        userId: "507f1f77bcf86cd799439011",
        businessId: "business-1",
        serviceResourceId: "resource-1",
        fName: "Jane",
        lName: "Doe",
        gender: "female",
        email: "jane@example.com",
        phone: "+14155552671",
        partySize: 3,
        startDate: new Date("2030-01-02T00:00:00.000Z"),
        endDate: new Date("2030-01-02T00:00:00.000Z"),
        timein: new Date("2030-01-02T09:00:00.000Z"),
        timeout: new Date("2030-01-02T10:00:00.000Z"),
        status: "pending",
    });

    assert.equal(receivedAvailabilityContext.businessId, "business-1");
    assert.equal(receivedAvailabilityContext.serviceResourceId, "resource-1");
    assert.equal(receivedAvailabilityContext.bufferBeforeMinutes, 15);
    assert.equal(receivedAvailabilityContext.bufferAfterMinutes, 10);
    assert.equal(receivedCreatedBooking.customerId, "customer-1");
    assert.deepEqual(receivedCreatedBooking.notificationPlan.channels, ["email"]);
    assert.ok(receivedCreatedBooking.notificationPlan.confirmationPlannedAt instanceof Date);
    assert.equal(incrementPayload.customerId, "customer-1");
    assert.equal(createdBooking.customerId, "customer-1");
});

test("cancelBookingAsCustomer rejects unauthorized customer sessions", async () => {
    const service = new BookingService(createRepositoryStub({
        findById: async () => ({
            _id: "booking-1",
            customerId: "customer-1",
        }),
    }));

    await assert.rejects(
        async () => service.cancelBookingAsCustomer("booking-1", { customerId: "customer-2" }),
        /Customer is not authorized to manage this booking/,
    );
});

test("getBookingById adds a high conflict-risk indicator for urgent repeat-rescheduled pending bookings", async () => {
    const now = Date.now();
    const service = new BookingService(createRepositoryStub({
        getConflictRiskContext: async () => ({
            adjacentBookingCount: 2,
            minimumGapMinutes: 15,
            sameDayActiveBookingCount: 6,
        }),
        findById: async () => ({
            _id: "booking-1",
            status: "pending",
            partySize: 8,
            createdAt: new Date(now - 2 * 24 * 60 * 60_000),
            timein: new Date(now + 2 * 60 * 60_000),
            endDate: new Date(now + 3 * 60 * 60_000),
            startDate: new Date(now + 2 * 60 * 60_000),
            timeout: new Date(now + 3 * 60 * 60_000),
            rescheduleHistory: [
                { rescheduledAt: new Date("2030-01-01T00:00:00.000Z") },
                { rescheduledAt: new Date("2030-01-02T00:00:00.000Z") },
            ],
            statusHistory: [{ fromStatus: "pending", toStatus: "pending", changedAt: new Date(), changedByRole: "system" }],
        }),
    }));

    const booking = await service.getBookingById("booking-1");

    assert.equal(booking.conflictRisk.level, "high");
    assert.equal(booking.conflictRisk.score, 100);
    assert.deepEqual(
        booking.conflictRisk.signals.map((signal) => signal.code).sort(),
        ["approval_stale", "heavy_day_load", "large_party", "repeat_reschedule", "starts_soon", "tight_turnaround"],
    );
});

test("getAllBookings decorates list results with medium conflict-risk metadata", async () => {
    const now = Date.now();
    const service = new BookingService(createRepositoryStub({
        findAll: async () => ({
            data: [{
                _id: "booking-1",
                status: "pending",
                createdAt: new Date(now - 2 * 24 * 60 * 60_000),
                timein: new Date(now + 48 * 60 * 60_000),
                endDate: new Date(now + 49 * 60 * 60_000),
                startDate: new Date(now + 48 * 60 * 60_000),
                timeout: new Date(now + 49 * 60 * 60_000),
                statusHistory: [{ fromStatus: "pending", toStatus: "pending", changedAt: new Date(), changedByRole: "system" }],
            }],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
            sort: { sortBy: "createdAt", sortOrder: "desc" },
        }),
    }));

    const result = await service.getAllBookings();

    assert.equal(result.data[0].conflictRisk.level, "medium");
    assert.equal(result.data[0].conflictRisk.score, 20);
    assert.deepEqual(
        result.data[0].conflictRisk.signals.map((signal) => signal.code),
        ["approval_stale"],
    );
});

test("getBookingSuggestions returns the requested slot when it is available", async () => {
    const service = new BookingService(createRepositoryStub());

    const result = await service.getBookingSuggestions({
        startDate: "2030-01-02T00:00:00.000Z",
        endDate: "2030-01-03T00:00:00.000Z",
        timein: "2030-01-02T09:00:00.000Z",
        timeout: "2030-01-02T10:00:00.000Z",
        maxSuggestions: 2,
    });

    assert.equal(result.data.length, 2);
    assert.equal(result.data[0].differenceMinutes, 0);
    assert.equal(result.data[0].summary, "Requested slot is currently available.");
    assert.equal(result.meta.maxSuggestions, 2);
});

test("getBookingSuggestions falls forward to the next slot when the requested time is unavailable", async () => {
    const requestedTimeIn = new Date("2030-01-02T09:00:00.000Z");
    const service = new BookingService(createRepositoryStub({
        findOverlapping: async (_startDate, _endDate, timein) => {
            if (timein.toISOString() === requestedTimeIn.toISOString()) {
                return { _id: "overlap-booking" };
            }

            return null;
        },
    }));

    const result = await service.getBookingSuggestions({
        startDate: "2030-01-02T00:00:00.000Z",
        endDate: "2030-01-03T00:00:00.000Z",
        timein: "2030-01-02T09:00:00.000Z",
        timeout: "2030-01-02T10:00:00.000Z",
        maxSuggestions: 2,
    });

    assert.equal(result.data.length, 2);
    assert.equal(result.data[0].timein.toISOString(), "2030-01-02T09:30:00.000Z");
    assert.equal(result.data[0].differenceMinutes, 30);
    assert.match(result.data[0].summary, /same day 30 minutes later/i);
});

test("getCancellationNoShowInsights summarizes lifecycle rates and reasons", async () => {
    let receivedFilters = null;
    const service = new BookingService(createRepositoryStub({
        findInsightsSource: async (filters) => {
            receivedFilters = filters;
            return [
                {
                    status: "cancelled",
                    startDate: new Date("2030-01-07T00:00:00.000Z"),
                    statusHistory: [{ toStatus: "cancelled", reason: "Travel delay" }],
                },
                {
                    status: "no_show",
                    startDate: new Date("2030-01-08T00:00:00.000Z"),
                    statusHistory: [{ toStatus: "no_show", reason: "Forgot appointment" }],
                },
                {
                    status: "completed",
                    startDate: new Date("2030-01-09T00:00:00.000Z"),
                    statusHistory: [{ toStatus: "completed" }],
                },
            ];
        },
    }));

    const insights = await service.getCancellationNoShowInsights({
        startDateFrom: "2030-01-01T00:00:00.000Z",
        startDateTo: "2030-01-31T00:00:00.000Z",
        businessId: "507f1f77bcf86cd799439011",
    });

    assert.deepEqual(receivedFilters.startDateFrom, new Date("2030-01-01T00:00:00.000Z"));
    assert.equal(receivedFilters.businessId, "507f1f77bcf86cd799439011");
    assert.equal(insights.summary.totalBookings, 3);
    assert.equal(insights.summary.cancelledBookings, 1);
    assert.equal(insights.summary.noShowBookings, 1);
    assert.equal(insights.summary.completedBookings, 1);
    assert.equal(insights.summary.cancellationRate, 33.33);
    assert.equal(insights.summary.noShowRate, 33.33);
    assert.equal(insights.trends.cancellationReasons[0].reason, "Travel delay");
    assert.equal(insights.trends.noShowReasons[0].reason, "Forgot appointment");
});

test("getBookingDashboardInsights summarizes funnel, utilization, peaks, and rates", async () => {
    let receivedFilters = null;
    const service = new BookingService(createRepositoryStub({
        findInsightsSource: async (filters) => {
            receivedFilters = filters;
            return [
                {
                    status: "pending",
                    startDate: new Date("2030-01-08T00:00:00.000Z"),
                    timein: new Date("2030-01-08T09:00:00.000Z"),
                    timeout: new Date("2030-01-08T10:00:00.000Z"),
                    partySize: 2,
                    serviceResourceId: "resource-1",
                },
                {
                    status: "approved",
                    startDate: new Date("2030-01-08T00:00:00.000Z"),
                    timein: new Date("2030-01-08T09:00:00.000Z"),
                    timeout: new Date("2030-01-08T11:00:00.000Z"),
                    partySize: 3,
                    serviceResourceId: "resource-1",
                },
                {
                    status: "completed",
                    startDate: new Date("2030-01-09T00:00:00.000Z"),
                    timein: new Date("2030-01-09T14:00:00.000Z"),
                    timeout: new Date("2030-01-09T15:30:00.000Z"),
                    partySize: 4,
                    serviceResourceId: "resource-2",
                },
                {
                    status: "cancelled",
                    startDate: new Date("2030-01-10T00:00:00.000Z"),
                    timein: new Date("2030-01-10T16:00:00.000Z"),
                    timeout: new Date("2030-01-10T17:00:00.000Z"),
                    partySize: 1,
                    serviceResourceId: "resource-2",
                },
                {
                    status: "no_show",
                    startDate: new Date("2030-01-08T00:00:00.000Z"),
                    timein: new Date("2030-01-08T09:00:00.000Z"),
                    timeout: new Date("2030-01-08T09:30:00.000Z"),
                    partySize: 2,
                    serviceResourceId: "resource-1",
                },
            ];
        },
    }));

    const insights = await service.getBookingDashboardInsights({
        startDateFrom: "2030-01-01T00:00:00.000Z",
        startDateTo: "2030-01-31T00:00:00.000Z",
        businessId: "507f1f77bcf86cd799439011",
    });

    assert.deepEqual(receivedFilters.startDateFrom, new Date("2030-01-01T00:00:00.000Z"));
    assert.equal(receivedFilters.businessId, "507f1f77bcf86cd799439011");
    assert.equal(insights.summary.totalBookings, 5);
    assert.equal(insights.summary.pendingBookings, 1);
    assert.equal(insights.summary.approvedBookings, 1);
    assert.equal(insights.summary.completedBookings, 1);
    assert.equal(insights.summary.cancelledBookings, 1);
    assert.equal(insights.summary.noShowBookings, 1);
    assert.equal(insights.summary.rejectedBookings, 0);
    assert.equal(insights.summary.approvalRate, 60);
    assert.equal(insights.summary.completionRate, 20);
    assert.equal(insights.summary.conversionRate, 20);
    assert.equal(insights.summary.utilizationMinutes, 360);
    assert.equal(insights.summary.averagePartySize, 2.4);
    assert.equal(insights.funnel.find((entry) => entry.status === "no_show").count, 1);
    assert.equal(insights.utilization.byResource[0].resourceId, "resource-1");
    assert.equal(insights.utilization.byResource[0].bookings, 3);
    assert.equal(insights.peaks.busiestHour, "09:00");
    assert.equal(insights.peaks.topTimeSlots[0].label, "09:00");
    assert.equal(insights.peaks.topTimeSlots[0].bookings, 3);
});

test("getBookingTimeline groups sorted bookings by start date and reports day summaries", async () => {
    const now = Date.UTC(2030, 0, 15, 9, 0, 0);
    const firstBookingStart = new Date(now + 2 * 60 * 60_000);
    const firstBookingEnd = new Date(now + 3 * 60 * 60_000);
    const secondBookingStart = new Date(now + 4 * 60 * 60_000);
    const secondBookingEnd = new Date(now + 5.5 * 60 * 60_000);
    const timelineDate = firstBookingStart.toISOString().slice(0, 10);
    const service = new BookingService(createRepositoryStub({
        getConflictRiskContext: async () => ({
            adjacentBookingCount: 2,
            minimumGapMinutes: 15,
            sameDayActiveBookingCount: 6,
        }),
        findAll: async () => ({
            data: [
                {
                    _id: "booking-2",
                    fName: "Sam",
                    lName: "Jones",
                    startDate: new Date(Date.UTC(secondBookingStart.getUTCFullYear(), secondBookingStart.getUTCMonth(), secondBookingStart.getUTCDate())),
                    endDate: new Date(Date.UTC(secondBookingEnd.getUTCFullYear(), secondBookingEnd.getUTCMonth(), secondBookingEnd.getUTCDate())),
                    timein: secondBookingStart,
                    timeout: secondBookingEnd,
                    status: "approved",
                    statusHistory: [{ fromStatus: "approved", toStatus: "approved", changedAt: new Date(), changedByRole: "system" }],
                    conflictRisk: { level: "low", score: 0, summary: "none", evaluatedAt: new Date(), signals: [] },
                },
                {
                    _id: "booking-1",
                    fName: "Jane",
                    lName: "Doe",
                    startDate: new Date(Date.UTC(firstBookingStart.getUTCFullYear(), firstBookingStart.getUTCMonth(), firstBookingStart.getUTCDate())),
                    endDate: new Date(Date.UTC(firstBookingEnd.getUTCFullYear(), firstBookingEnd.getUTCMonth(), firstBookingEnd.getUTCDate())),
                    timein: firstBookingStart,
                    timeout: firstBookingEnd,
                    status: "pending",
                    partySize: 8,
                    rescheduleHistory: [
                        { rescheduledAt: new Date(), previousStartDate: new Date(), previousEndDate: new Date(), previousTimein: new Date(), previousTimeout: new Date(), newStartDate: new Date(), newEndDate: new Date(), newTimein: new Date(), newTimeout: new Date(), rescheduledByRole: "staff" },
                        { rescheduledAt: new Date(), previousStartDate: new Date(), previousEndDate: new Date(), previousTimein: new Date(), previousTimeout: new Date(), newStartDate: new Date(), newEndDate: new Date(), newTimein: new Date(), newTimeout: new Date(), rescheduledByRole: "staff" },
                    ],
                    statusHistory: [{ fromStatus: "pending", toStatus: "pending", changedAt: new Date(), changedByRole: "system" }],
                    conflictRisk: { level: "high", score: 80, summary: "high", evaluatedAt: new Date(), signals: [] },
                },
            ],
            pagination: { page: 1, limit: 500, total: 2, totalPages: 1 },
            sort: { sortBy: "startDate", sortOrder: "asc" },
        }),
    }));

    const timeline = await service.getBookingTimeline({
        startDateFrom: new Date(now).toISOString(),
        startDateTo: new Date(now + 24 * 60 * 60_000).toISOString(),
    });

    assert.equal(timeline.data.length, 1);
    assert.equal(timeline.data[0].date, timelineDate);
    assert.equal(timeline.data[0].bookings[0].id, "booking-1");
    assert.equal(timeline.data[0].bookings[0].durationMinutes, 60);
    assert.equal(timeline.data[0].bookings[0].isRescheduled, true);
    assert.equal(timeline.data[0].summary.totalBookings, 2);
    assert.equal(timeline.data[0].summary.pendingBookings, 1);
    assert.equal(timeline.data[0].summary.approvedBookings, 1);
    assert.equal(timeline.data[0].summary.highRiskBookings, 1);
    assert.equal(timeline.meta.totalTimelineDays, 1);
    assert.equal(timeline.meta.totalBookings, 2);
    assert.equal(timeline.meta.rangeStart, new Date(now).toISOString());
});
