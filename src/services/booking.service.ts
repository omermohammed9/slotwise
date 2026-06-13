import { SlotwiseRole } from "../interfaces/auth.interface";
import mongoose from "mongoose";
import {
    AvailabilityRules,
    BlackoutDate,
    IBusinessProfile,
    NotificationChannel,
    WorkingHour,
} from "../interfaces/business.interface";
import {
    BookingConflictRisk,
    BookingConflictRiskSignal,
    BookingNotificationPlan,
    BookingRescheduleEntry,
    BookingStatus,
    BookingStatusAuditEntry,
    IBooking,
} from "../interfaces/booking.interface";
import { ICustomer } from "../interfaces/customer.interface";
import { IServiceResource } from "../interfaces/service-resource.interface";
import { BusinessProfileRepository, BusinessProfileRepositoryContract } from "../repositories/business-profile.repository";
import {
    BookingAvailabilityContext,
    BookingListFilters,
    BookingListOptions,
    BookingListResult,
    BookingRepository,
    BookingRepositoryContract,
    BookingSortField,
    SortOrder,
} from "../repositories/booking.repository";
import { CustomerRepository, CustomerRepositoryContract } from "../repositories/customer.repository";
import { NotificationJobRepository, NotificationJobRepositoryContract } from "../repositories/notification-job.repository";
import { ServiceResourceRepository, ServiceResourceRepositoryContract } from "../repositories/service-resource.repository";
import { createSessionId } from "../utils/authCrypto";
import { verifyEmail } from "../utils/emailVerifier";
import { getOptionalEnv } from "../config/env";

export interface BookingListQuery {
    status?: string;
    conflictRiskLevel?: string;
    startDateFrom?: string;
    startDateTo?: string;
    businessId?: string;
    customerId?: string;
    serviceResourceId?: string;
    email?: string;
    phone?: string;
    customerName?: string;
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
}

export interface BookingStatusChangeContext {
    changedByRole: SlotwiseRole;
    changedBy?: string;
    reason?: string;
}

export interface BookingRescheduleContext extends BookingStatusChangeContext {
    reason?: string;
}

export interface CustomerBookingActionPayload {
    customerId: string;
    reason?: string;
}

export interface BookingSuggestionRequest {
    businessId?: string;
    serviceResourceId?: string;
    partySize?: number;
    startDate: string;
    endDate: string;
    timein: string;
    timeout: string;
    maxSuggestions?: number;
}

export interface BookingSuggestion {
    startDate: Date;
    endDate: Date;
    timein: Date;
    timeout: Date;
    score: number;
    differenceMinutes: number;
    summary: string;
    conflictRisk: BookingConflictRisk;
}

export interface BookingSuggestionsResult {
    data: BookingSuggestion[];
    meta: {
        maxSuggestions: number;
        slotIntervalMinutes: number;
        searchWindowDays: number;
        requestedTimein: string;
        requestedTimeout: string;
    };
}

export interface BookingInsightsQuery {
    startDateFrom?: string;
    startDateTo?: string;
    businessId?: string;
    serviceResourceId?: string;
}

export interface BookingTimelineQuery extends BookingListQuery {}

export interface BookingTimelineEntry {
    id: string;
    startDate: Date;
    endDate: Date;
    timein: Date;
    timeout: Date;
    status: BookingStatus;
    customerName: string;
    businessId?: string;
    customerId?: string;
    serviceResourceId?: string;
    partySize?: number;
    conflictRisk?: BookingConflictRisk;
    durationMinutes: number;
    isRescheduled: boolean;
}

export interface BookingTimelineDay {
    date: string;
    bookings: BookingTimelineEntry[];
    summary: {
        totalBookings: number;
        pendingBookings: number;
        approvedBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        noShowBookings: number;
        highRiskBookings: number;
    };
}

export interface BookingTimelineResult {
    data: BookingTimelineDay[];
    meta: {
        rangeStart?: string;
        rangeEnd?: string;
        totalTimelineDays: number;
        totalBookings: number;
    };
}

export interface BookingInsightsReasonBreakdown {
    reason: string;
    count: number;
}

export interface BookingCancellationNoShowInsights {
    summary: {
        totalBookings: number;
        cancelledBookings: number;
        noShowBookings: number;
        completedBookings: number;
        cancellationRate: number;
        noShowRate: number;
        serviceDeliveryRate: number;
    };
    trends: {
        cancellationReasons: BookingInsightsReasonBreakdown[];
        noShowReasons: BookingInsightsReasonBreakdown[];
        byWeekday: Array<{
            weekday: string;
            cancellations: number;
            noShows: number;
        }>;
    };
}

export interface BookingDashboardInsights {
    summary: {
        totalBookings: number;
        pendingBookings: number;
        approvedBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        noShowBookings: number;
        rejectedBookings: number;
        approvalRate: number;
        completionRate: number;
        conversionRate: number;
        utilizationMinutes: number;
        averagePartySize: number;
    };
    funnel: Array<{
        status: BookingStatus;
        count: number;
    }>;
    utilization: {
        byWeekday: Array<{
            weekday: string;
            bookings: number;
            bookedMinutes: number;
        }>;
        byResource: Array<{
            resourceId: string;
            bookings: number;
            bookedMinutes: number;
        }>;
    };
    peaks: {
        busiestWeekday?: string;
        busiestHour?: string;
        topTimeSlots: Array<{
            label: string;
            bookings: number;
        }>;
    };
}

interface EffectiveAvailabilityContext {
    business: IBusinessProfile | null;
    serviceResource: IServiceResource | null;
    customer: ICustomer | null;
    availabilityRules: AvailabilityRules | null;
    workingHours: WorkingHour[];
    blackoutDates: BlackoutDate[];
    availabilityContext: BookingAvailabilityContext;
    notificationPlan?: BookingNotificationPlan;
}

const weekdayNameToNumber: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};

const allowedStatusTransitions: Record<BookingStatus, BookingStatus[]> = {
    pending: ["approved", "rejected", "cancelled"],
    approved: ["completed", "cancelled", "no_show"],
    rejected: [],
    cancelled: [],
    completed: [],
    no_show: [],
};
const bookingStatuses: BookingStatus[] = ["pending", "approved", "rejected", "cancelled", "completed", "no_show"];
const bookingSortFields: BookingSortField[] = ["createdAt", "updatedAt", "startDate", "endDate", "status"];
const sortOrders: SortOrder[] = ["asc", "desc"];
const defaultListOptions: BookingListOptions = {
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
};
const defaultSuggestionCount = 3;
const maxSuggestionCount = 5;
const defaultSuggestionSearchWindowDays = 7;
const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const legacyStatusHistoryReason = "Backfilled legacy booking status history";
const initialStatusHistoryReason = "Initial booking status recorded";

export class BookingService {
    private static instance: BookingService;
    private readonly bookingRepository: BookingRepositoryContract;
    private readonly businessProfileRepository: BusinessProfileRepositoryContract;
    private readonly serviceResourceRepository: ServiceResourceRepositoryContract;
    private readonly customerRepository: CustomerRepositoryContract;
    private readonly notificationJobRepository: NotificationJobRepositoryContract;

    public constructor(
        bookingRepository: BookingRepositoryContract = BookingRepository.getInstance(),
        businessProfileRepository: BusinessProfileRepositoryContract = BusinessProfileRepository.getInstance(),
        serviceResourceRepository: ServiceResourceRepositoryContract = ServiceResourceRepository.getInstance(),
        customerRepository: CustomerRepositoryContract = CustomerRepository.getInstance(),
        notificationJobRepository: NotificationJobRepositoryContract = NotificationJobRepository.getInstance(),
    ) {
        this.bookingRepository = bookingRepository;
        this.businessProfileRepository = businessProfileRepository;
        this.serviceResourceRepository = serviceResourceRepository;
        this.customerRepository = customerRepository;
        this.notificationJobRepository = notificationJobRepository;
    }

    public static getInstance(): BookingService {
        if (!BookingService.instance) {
            BookingService.instance = new BookingService();
        }
        return BookingService.instance;
    }

    public async checkAvailability(
        startDate: Date,
        endDate: Date,
        timein: Date,
        timeout: Date,
        context: BookingAvailabilityContext = {},
    ): Promise<boolean> {
        const overlapBooking = await this.bookingRepository.findOverlapping(startDate, endDate, timein, timeout, context);
        return !overlapBooking;
    }

    public async createBooking(bookingData: IBooking): Promise<IBooking | null> {
        await this.validateEmailAddress(bookingData.email);

        const effectiveContext = await this.prepareEffectiveAvailabilityContext(bookingData);
        await this.assertBookingCanBeScheduled(bookingData, effectiveContext);

        try {
            const customer = await this.resolveCustomerForBooking(bookingData, effectiveContext.customer);
            const normalizedBookingData = {
                ...bookingData,
                ...(customer ? { customerId: customer._id } : {}),
                ...(effectiveContext.notificationPlan ? { notificationPlan: effectiveContext.notificationPlan } : {}),
            } as IBooking;

            if (!normalizedBookingData.statusHistory || normalizedBookingData.statusHistory.length === 0) {
                normalizedBookingData.statusHistory = [
                    this.createAuditEntry(normalizedBookingData.status ?? "pending", normalizedBookingData.status ?? "pending", {
                        changedByRole: "system",
                        reason: initialStatusHistoryReason,
                    }),
                ];
            }

            normalizedBookingData.conflictRisk = await this.createConflictRiskSnapshot(normalizedBookingData);
            const createdBooking = await this.bookingRepository.create(normalizedBookingData);

            if (customer) {
                await this.customerRepository.incrementBookingCount(String(customer._id), bookingData.startDate);
            }

            await this.enqueueBookingNotificationJobs(
                createdBooking,
                effectiveContext.business?.name,
                "booking_confirmation",
                createdBooking.notificationPlan?.confirmationPlannedAt ? [createdBooking.notificationPlan.confirmationPlannedAt] : [],
            );

            return await this.decorateBookingForResponse(createdBooking);
        } catch (error) {
            throw new Error("Error creating booking");
        }
    }

    public async getAllBookings(query: BookingListQuery = {}): Promise<BookingListResult> {
        try {
            const filters = this.parseListFilters(query);
            const options = this.parseListOptions(query);
            const result = await this.bookingRepository.findAll(filters, options);
            return {
                ...result,
                data: await Promise.all(result.data.map(async (booking) => this.decorateBookingForResponse(booking) as Promise<IBooking>)),
            };
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid booking list query")) {
                throw error;
            }

            throw new Error("Error getting bookings");
        }
    }

    public async getBookingSuggestions(request: BookingSuggestionRequest): Promise<BookingSuggestionsResult> {
        try {
            const suggestionBooking = this.buildSuggestionBooking(request);
            const effectiveContext = await this.prepareEffectiveAvailabilityContext(suggestionBooking);
            const slotIntervalMinutes = effectiveContext.availabilityRules?.slotIntervalMinutes ?? 30;
            const maxSuggestions = Math.min(request.maxSuggestions ?? defaultSuggestionCount, maxSuggestionCount);
            const candidateOffsets = this.buildSuggestionCandidateOffsets(slotIntervalMinutes, defaultSuggestionSearchWindowDays);
            const suggestions: BookingSuggestion[] = [];
            const seenCandidateKeys = new Set<string>();

            for (const offset of candidateOffsets) {
                const candidateBooking = this.shiftBookingWindow(suggestionBooking, offset.totalMinutes);
                const candidateKey = candidateBooking.timein.toISOString();

                if (seenCandidateKeys.has(candidateKey)) {
                    continue;
                }

                seenCandidateKeys.add(candidateKey);

                try {
                    await this.assertBookingCanBeScheduled(candidateBooking, effectiveContext);
                } catch (error) {
                    if (error instanceof Error && this.isRecoverableSuggestionRejection(error.message)) {
                        continue;
                    }

                    throw error;
                }

                const conflictRisk = await this.evaluateConflictRisk(candidateBooking);
                suggestions.push({
                    startDate: candidateBooking.startDate,
                    endDate: candidateBooking.endDate,
                    timein: candidateBooking.timein,
                    timeout: candidateBooking.timeout,
                    score: this.scoreSuggestion(Math.abs(offset.totalMinutes), conflictRisk.score, slotIntervalMinutes),
                    differenceMinutes: Math.abs(offset.totalMinutes),
                    summary: this.describeSuggestion(offset.totalMinutes),
                    conflictRisk,
                });

                if (suggestions.length >= maxSuggestions) {
                    break;
                }
            }

            return {
                data: suggestions,
                meta: {
                    maxSuggestions,
                    slotIntervalMinutes,
                    searchWindowDays: defaultSuggestionSearchWindowDays,
                    requestedTimein: suggestionBooking.timein.toISOString(),
                    requestedTimeout: suggestionBooking.timeout.toISOString(),
                },
            };
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid booking suggestion request")) {
                throw error;
            }

            throw new Error("Error generating booking suggestions");
        }
    }

    public async getCancellationNoShowInsights(query: BookingInsightsQuery = {}): Promise<BookingCancellationNoShowInsights> {
        try {
            const filters = this.parseInsightsFilters(query);
            const bookings = await this.bookingRepository.findInsightsSource(filters);
            const totalBookings = bookings.length;
            const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled");
            const noShowBookings = bookings.filter((booking) => booking.status === "no_show");
            const completedBookings = bookings.filter((booking) => booking.status === "completed");
            const denominator = totalBookings === 0 ? 1 : totalBookings;

            return {
                summary: {
                    totalBookings,
                    cancelledBookings: cancelledBookings.length,
                    noShowBookings: noShowBookings.length,
                    completedBookings: completedBookings.length,
                    cancellationRate: this.toRate(cancelledBookings.length, denominator),
                    noShowRate: this.toRate(noShowBookings.length, denominator),
                    serviceDeliveryRate: this.toRate(completedBookings.length, denominator),
                },
                trends: {
                    cancellationReasons: this.buildReasonBreakdown(cancelledBookings, "cancelled"),
                    noShowReasons: this.buildReasonBreakdown(noShowBookings, "no_show"),
                    byWeekday: this.buildWeekdayBreakdown(bookings),
                },
            };
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid booking insights query")) {
                throw error;
            }

            throw new Error("Error getting booking insights");
        }
    }

    public async getBookingDashboardInsights(query: BookingInsightsQuery = {}): Promise<BookingDashboardInsights> {
        try {
            const filters = this.parseInsightsFilters(query);
            const bookings = await this.bookingRepository.findInsightsSource(filters);
            const totalBookings = bookings.length;
            const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
            const approvedBookings = bookings.filter((booking) => booking.status === "approved").length;
            const completedBookings = bookings.filter((booking) => booking.status === "completed").length;
            const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled").length;
            const noShowBookings = bookings.filter((booking) => booking.status === "no_show").length;
            const rejectedBookings = bookings.filter((booking) => booking.status === "rejected").length;
            const denominator = totalBookings === 0 ? 1 : totalBookings;
            const totalUtilizationMinutes = bookings.reduce(
                (total, booking) => total + this.calculateDurationMinutes(
                    "timein" in booking ? booking.timein : undefined,
                    "timeout" in booking ? booking.timeout : undefined,
                ),
                0,
            );
            const totalPartySize = bookings.reduce(
                (total, booking) => total + ("partySize" in booking ? Number(booking.partySize ?? 1) : 1),
                0,
            );

            const weekdayUtilizationMap = new Map<string, { bookings: number; bookedMinutes: number }>();
            const resourceUtilizationMap = new Map<string, { bookings: number; bookedMinutes: number }>();
            const hourPeakMap = new Map<string, number>();

            for (const booking of bookings) {
                const weekday = weekdayLabels[booking.startDate.getUTCDay()];
                const bookedMinutes = this.calculateDurationMinutes(
                    "timein" in booking ? booking.timein : undefined,
                    "timeout" in booking ? booking.timeout : undefined,
                );
                const weekdayEntry = weekdayUtilizationMap.get(weekday) ?? { bookings: 0, bookedMinutes: 0 };
                weekdayEntry.bookings += 1;
                weekdayEntry.bookedMinutes += bookedMinutes;
                weekdayUtilizationMap.set(weekday, weekdayEntry);

                if (booking.serviceResourceId) {
                    const resourceId = String(booking.serviceResourceId);
                    const resourceEntry = resourceUtilizationMap.get(resourceId) ?? { bookings: 0, bookedMinutes: 0 };
                    resourceEntry.bookings += 1;
                    resourceEntry.bookedMinutes += bookedMinutes;
                    resourceUtilizationMap.set(resourceId, resourceEntry);
                }

                if ("timein" in booking && booking.timein instanceof Date) {
                    const timeSlot = this.buildHourSlotLabel(booking.timein);
                    hourPeakMap.set(timeSlot, (hourPeakMap.get(timeSlot) ?? 0) + 1);
                }
            }

            const byWeekday = weekdayLabels.map((weekday) => ({
                weekday,
                bookings: weekdayUtilizationMap.get(weekday)?.bookings ?? 0,
                bookedMinutes: weekdayUtilizationMap.get(weekday)?.bookedMinutes ?? 0,
            }));
            const byResource = [...resourceUtilizationMap.entries()]
                .map(([resourceId, value]) => ({
                    resourceId,
                    bookings: value.bookings,
                    bookedMinutes: value.bookedMinutes,
                }))
                .sort((left, right) => right.bookings - left.bookings || right.bookedMinutes - left.bookedMinutes);
            const topTimeSlots = [...hourPeakMap.entries()]
                .map(([label, count]) => ({ label, bookings: count }))
                .sort((left, right) => right.bookings - left.bookings || left.label.localeCompare(right.label))
                .slice(0, 5);
            const busiestWeekday = byWeekday.reduce<{ weekday?: string; bookings: number }>(
                (current, weekday) => weekday.bookings > current.bookings
                    ? { weekday: weekday.weekday, bookings: weekday.bookings }
                    : current,
                { bookings: 0 },
            ).weekday;

            return {
                summary: {
                    totalBookings,
                    pendingBookings,
                    approvedBookings,
                    completedBookings,
                    cancelledBookings,
                    noShowBookings,
                    rejectedBookings,
                    approvalRate: this.toRate(approvedBookings + completedBookings + noShowBookings, denominator),
                    completionRate: this.toRate(completedBookings, denominator),
                    conversionRate: this.toRate(completedBookings, denominator),
                    utilizationMinutes: totalUtilizationMinutes,
                    averagePartySize: totalBookings === 0 ? 0 : Number((totalPartySize / totalBookings).toFixed(2)),
                },
                funnel: [
                    { status: "pending", count: pendingBookings },
                    { status: "approved", count: approvedBookings },
                    { status: "completed", count: completedBookings },
                    { status: "cancelled", count: cancelledBookings },
                    { status: "no_show", count: noShowBookings },
                    { status: "rejected", count: rejectedBookings },
                ],
                utilization: {
                    byWeekday,
                    byResource,
                },
                peaks: {
                    ...(busiestWeekday ? { busiestWeekday } : {}),
                    ...(topTimeSlots[0] ? { busiestHour: topTimeSlots[0].label } : {}),
                    topTimeSlots,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid booking insights query")) {
                throw error;
            }

            throw new Error("Error getting booking dashboard insights");
        }
    }

    public async getBookingTimeline(query: BookingTimelineQuery = {}): Promise<BookingTimelineResult> {
        try {
            const filters = this.parseListFilters(query);
            const result = await this.bookingRepository.findAll(filters, {
                page: 1,
                limit: 500,
                sortBy: "startDate",
                sortOrder: "asc",
            });
            const decoratedBookings = await Promise.all(
                result.data.map(async (booking) => this.decorateBookingForResponse(booking) as Promise<IBooking>),
            );
            const groupedDays = new Map<string, BookingTimelineEntry[]>();

            for (const booking of decoratedBookings) {
                const timelineDate = booking.startDate.toISOString().slice(0, 10);
                const currentDayBookings = groupedDays.get(timelineDate) ?? [];
                currentDayBookings.push({
                    id: String(booking._id),
                    startDate: booking.startDate,
                    endDate: booking.endDate,
                    timein: booking.timein,
                    timeout: booking.timeout,
                    status: booking.status,
                    customerName: `${booking.fName} ${booking.lName}`.trim(),
                    ...(booking.businessId ? { businessId: String(booking.businessId) } : {}),
                    ...(booking.customerId ? { customerId: String(booking.customerId) } : {}),
                    ...(booking.serviceResourceId ? { serviceResourceId: String(booking.serviceResourceId) } : {}),
                    ...(booking.partySize ? { partySize: booking.partySize } : {}),
                    ...(booking.conflictRisk ? { conflictRisk: booking.conflictRisk } : {}),
                    durationMinutes: Math.max(0, Math.round((booking.timeout.getTime() - booking.timein.getTime()) / 60_000)),
                    isRescheduled: (booking.rescheduleHistory?.length ?? 0) > 0,
                });
                groupedDays.set(timelineDate, currentDayBookings);
            }

            const timelineDays = [...groupedDays.entries()].map(([date, bookings]) => {
                const sortedBookings = [...bookings].sort((left, right) => left.timein.getTime() - right.timein.getTime());

                return {
                    date,
                    bookings: sortedBookings,
                    summary: {
                        totalBookings: sortedBookings.length,
                        pendingBookings: sortedBookings.filter((booking) => booking.status === "pending").length,
                        approvedBookings: sortedBookings.filter((booking) => booking.status === "approved").length,
                        completedBookings: sortedBookings.filter((booking) => booking.status === "completed").length,
                        cancelledBookings: sortedBookings.filter((booking) => booking.status === "cancelled").length,
                        noShowBookings: sortedBookings.filter((booking) => booking.status === "no_show").length,
                        highRiskBookings: sortedBookings.filter((booking) => booking.conflictRisk?.level === "high").length,
                    },
                };
            });

            return {
                data: timelineDays,
                meta: {
                    ...(filters.startDateFrom ? { rangeStart: filters.startDateFrom.toISOString() } : {}),
                    ...(filters.startDateTo ? { rangeEnd: filters.startDateTo.toISOString() } : {}),
                    totalTimelineDays: timelineDays.length,
                    totalBookings: decoratedBookings.length,
                },
            };
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Invalid booking list query")) {
                throw error;
            }

            throw new Error("Error getting booking timeline");
        }
    }

    public async getBookingById(id: string): Promise<IBooking | null> {
        try {
            const booking = await this.bookingRepository.findById(id);
            return await this.decorateBookingForResponse(booking);
        } catch (error) {
            throw new Error("Error getting booking");
        }
    }

    public async updateBooking(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
        if (bookingData.email !== undefined) {
            await this.validateEmailAddress(bookingData.email);
        }

        const existingBooking = await this.bookingRepository.findById(id);
        if (!existingBooking) {
            return null;
        }

        const mergedBooking = {
            ...this.toPlainBookingData(existingBooking),
            ...bookingData,
        } as IBooking;

        const effectiveContext = await this.prepareEffectiveAvailabilityContext(mergedBooking, id);
        await this.assertBookingCanBeScheduled(mergedBooking, effectiveContext);

        try {
            const customer = await this.resolveCustomerForBooking(mergedBooking, effectiveContext.customer);
            const conflictRisk = await this.createConflictRiskSnapshot({
                ...mergedBooking,
                ...(customer ? { customerId: customer._id } : {}),
            } as IBooking, id);
            const updatedBooking = await this.bookingRepository.updateById(id, {
                ...bookingData,
                ...(customer ? { customerId: customer._id } : {}),
                ...(effectiveContext.notificationPlan ? { notificationPlan: effectiveContext.notificationPlan } : {}),
                conflictRisk,
            });
            return await this.decorateBookingForResponse(updatedBooking);
        } catch (error) {
            throw new Error("Error updating booking");
        }
    }

    public async deleteBooking(id: string): Promise<boolean> {
        try {
            return await this.bookingRepository.deleteById(id);
        } catch (error) {
            throw new Error("Error deleting booking");
        }
    }

    public async updateBookingStatus(
        id: string,
        status: BookingStatus,
        context: BookingStatusChangeContext,
    ): Promise<IBooking | null> {
        try {
            const booking = await this.bookingRepository.findById(id);
            if (!booking) {
                return null;
            }

            const hadPersistedStatusHistory = Boolean(booking.statusHistory && booking.statusHistory.length > 0);
            const backfilledBooking = await this.decorateBookingForResponse(booking) as IBooking;

            if (backfilledBooking.status === status) {
                return backfilledBooking;
            }

            if (!allowedStatusTransitions[backfilledBooking.status].includes(status)) {
                throw new Error(`Cannot change booking status from ${backfilledBooking.status} to ${status}`);
            }

            const auditEntries = [
                ...(hadPersistedStatusHistory
                    ? []
                    : [this.createLegacyStatusHistoryEntry(backfilledBooking.status, backfilledBooking.createdAt)]),
                this.createAuditEntry(backfilledBooking.status, status, context),
            ];
            const notificationPlan = await this.buildStatusNotificationPlan(backfilledBooking, status);
            const conflictRisk = await this.createConflictRiskSnapshot({
                ...backfilledBooking,
                status,
                ...(notificationPlan ? { notificationPlan } : {}),
            } as IBooking, id);

            const updatedBooking = await this.bookingRepository.updateStatusById(id, status, auditEntries, {
                ...(notificationPlan ? { notificationPlan } : {}),
                conflictRisk,
            });
            if (updatedBooking && status === "cancelled") {
                await this.enqueueBookingNotificationJobs(
                    updatedBooking,
                    undefined,
                    "booking_cancellation",
                    notificationPlan?.cancellationNoticePlannedAt ? [notificationPlan.cancellationNoticePlannedAt] : [],
                );
            }

            return await this.decorateBookingForResponse(updatedBooking);
        } catch (error) {
            if (error instanceof Error && error.message.startsWith("Cannot change booking status")) {
                throw error;
            }

            throw new Error("Error updating booking status");
        }
    }

    public async cancelBookingAsCustomer(
        id: string,
        payload: CustomerBookingActionPayload,
    ): Promise<IBooking | null> {
        const booking = await this.assertCustomerOwnsBooking(id, payload.customerId);
        if (!booking) {
            return null;
        }

        return this.updateBookingStatus(id, "cancelled", {
            changedByRole: "customer",
            changedBy: payload.customerId,
            ...(payload.reason ? { reason: payload.reason } : {}),
        });
    }

    public async rescheduleBooking(
        id: string,
        scheduleUpdate: Pick<IBooking, "startDate" | "endDate" | "timein" | "timeout">,
        context: BookingRescheduleContext,
    ): Promise<IBooking | null> {
        const existingBooking = await this.bookingRepository.findById(id);
        if (!existingBooking) {
            return null;
        }

        const mergedBooking = {
            ...this.toPlainBookingData(existingBooking),
            ...scheduleUpdate,
        } as IBooking;

        const effectiveContext = await this.prepareEffectiveAvailabilityContext(mergedBooking, id);
        await this.assertBookingCanBeScheduled(mergedBooking, effectiveContext);

        const rescheduleEntry = this.createRescheduleEntry(existingBooking, mergedBooking, context);
        const notificationPlan = effectiveContext.notificationPlan
            ? {
                ...effectiveContext.notificationPlan,
                rescheduleNoticePlannedAt: new Date(),
            }
            : undefined;
        const conflictRisk = await this.createConflictRiskSnapshot({
            ...mergedBooking,
            ...(notificationPlan ? { notificationPlan } : {}),
            rescheduleHistory: [
                ...((existingBooking.rescheduleHistory ?? []) as BookingRescheduleEntry[]),
                rescheduleEntry,
            ],
        } as IBooking, id);

        try {
            const updatedBooking = await this.bookingRepository.updateById(id, {
                startDate: scheduleUpdate.startDate,
                endDate: scheduleUpdate.endDate,
                timein: scheduleUpdate.timein,
                timeout: scheduleUpdate.timeout,
                notificationPlan,
                conflictRisk,
                rescheduleHistory: [
                    ...((existingBooking.rescheduleHistory ?? []) as BookingRescheduleEntry[]),
                    rescheduleEntry,
                ],
            });
            if (updatedBooking) {
                await this.enqueueBookingNotificationJobs(
                    updatedBooking,
                    undefined,
                    "booking_reschedule",
                    notificationPlan?.rescheduleNoticePlannedAt ? [notificationPlan.rescheduleNoticePlannedAt] : [],
                );
            }

            return await this.decorateBookingForResponse(updatedBooking);
        } catch (error) {
            throw new Error("Error rescheduling booking");
        }
    }

    public async rescheduleBookingAsCustomer(
        id: string,
        payload: CustomerBookingActionPayload & Pick<IBooking, "startDate" | "endDate" | "timein" | "timeout">,
    ): Promise<IBooking | null> {
        const booking = await this.assertCustomerOwnsBooking(id, payload.customerId);
        if (!booking) {
            return null;
        }

        return this.rescheduleBooking(id, {
            startDate: payload.startDate,
            endDate: payload.endDate,
            timein: payload.timein,
            timeout: payload.timeout,
        }, {
            changedByRole: "customer",
            changedBy: payload.customerId,
            ...(payload.reason ? { reason: payload.reason } : {}),
        });
    }

    private async validateEmailAddress(email: string): Promise<void> {
        const emailVerificationResult = await verifyEmail(email);

        if (
            emailVerificationResult.data.result !== "deliverable"
            || emailVerificationResult.data.status !== "valid"
            || emailVerificationResult.data.score < 40
            || emailVerificationResult.data.email !== email
        ) {
            throw new Error("Invalid email address");
        }
    }

    private async prepareEffectiveAvailabilityContext(
        bookingData: IBooking,
        excludeBookingId?: string,
    ): Promise<EffectiveAvailabilityContext> {
        if (!bookingData.businessId && !bookingData.serviceResourceId && !bookingData.customerId) {
            return {
                business: null,
                serviceResource: null,
                customer: null,
                availabilityRules: null,
                workingHours: [],
                blackoutDates: [],
                availabilityContext: {},
            };
        }

        if (bookingData.serviceResourceId && !bookingData.businessId) {
            throw new Error("businessId is required when serviceResourceId is provided");
        }

        if (bookingData.customerId && !bookingData.businessId) {
            throw new Error("businessId is required when customerId is provided");
        }

        const business = bookingData.businessId
            ? await this.businessProfileRepository.findActiveById(String(bookingData.businessId))
            : null;
        if (bookingData.businessId && !business) {
            throw new Error("Business profile not found or inactive");
        }

        const serviceResource = bookingData.serviceResourceId
            ? await this.serviceResourceRepository.findById(String(bookingData.serviceResourceId))
            : null;
        if (bookingData.serviceResourceId && !serviceResource) {
            throw new Error("Service resource not found");
        }

        if (business && serviceResource && String(serviceResource.businessId) !== String(business._id)) {
            throw new Error("Service resource does not belong to the selected business");
        }

        if (serviceResource && !serviceResource.active) {
            throw new Error("Service resource is inactive");
        }

        const customer = bookingData.customerId
            ? await this.customerRepository.findById(String(bookingData.customerId))
            : null;
        if (bookingData.customerId && !customer) {
            throw new Error("Customer record not found");
        }

        if (business && customer && String(customer.businessId) !== String(business._id)) {
            throw new Error("Customer record does not belong to the selected business");
        }

        const availabilityRules = business
            ? this.mergeAvailabilityRules(business.availabilityRules, serviceResource?.availabilityOverrides)
            : null;
        const workingHours = serviceResource?.availabilityOverrides?.workingHours ?? business?.workingHours ?? [];
        const blackoutDates = [
            ...(business?.blackoutDates ?? []),
            ...(serviceResource?.availabilityOverrides?.blackoutDates ?? []),
        ];
        const notificationPlan = business
            ? this.buildNotificationPlan(bookingData, business, customer)
            : undefined;

        return {
            business,
            serviceResource,
            customer,
            availabilityRules,
            workingHours,
            blackoutDates,
            availabilityContext: {
                businessId: bookingData.businessId ? String(bookingData.businessId) : undefined,
                serviceResourceId: bookingData.serviceResourceId ? String(bookingData.serviceResourceId) : undefined,
                excludeBookingId,
                bufferBeforeMinutes: availabilityRules?.bufferBeforeMinutes,
                bufferAfterMinutes: availabilityRules?.bufferAfterMinutes,
            },
            notificationPlan,
        };
    }

    private async assertBookingCanBeScheduled(
        bookingData: IBooking,
        effectiveContext: EffectiveAvailabilityContext,
    ): Promise<void> {
        if (effectiveContext.availabilityRules) {
            this.validateAdvanceWindow(bookingData, effectiveContext.availabilityRules);
            this.validateBlackoutDates(bookingData, effectiveContext.blackoutDates);
            this.validateWorkingHours(bookingData, effectiveContext.business?.timezone ?? "UTC", effectiveContext.workingHours);
            this.validateSlotInterval(bookingData, effectiveContext.availabilityRules);
            this.validateCapacity(bookingData, effectiveContext.serviceResource);
        }

        const isAvailable = await this.checkAvailability(
            bookingData.startDate,
            bookingData.endDate,
            bookingData.timein,
            bookingData.timeout,
            effectiveContext.availabilityContext,
        );

        if (!isAvailable) {
            throw new Error("The booking slot is not available.");
        }
    }

    private async resolveCustomerForBooking(
        bookingData: IBooking,
        existingCustomer: ICustomer | null,
    ): Promise<ICustomer | null> {
        if (!bookingData.businessId) {
            return null;
        }

        if (existingCustomer) {
            return existingCustomer;
        }

        return this.customerRepository.upsertFromBooking(bookingData);
    }

    private parseListFilters(query: BookingListQuery): BookingListFilters {
        const filters: BookingListFilters = {};

        if (query.status !== undefined) {
            if (!bookingStatuses.includes(query.status as BookingStatus)) {
                throw new Error("Invalid booking list query: status is not supported");
            }
            filters.status = query.status as BookingStatus;
        }

        if (query.conflictRiskLevel !== undefined) {
            if (!["low", "medium", "high"].includes(query.conflictRiskLevel)) {
                throw new Error("Invalid booking list query: conflictRiskLevel is not supported");
            }

            filters.conflictRiskLevel = query.conflictRiskLevel as "low" | "medium" | "high";
        }

        if (query.startDateFrom !== undefined) {
            filters.startDateFrom = this.parseDateQuery(query.startDateFrom, "startDateFrom");
        }

        if (query.startDateTo !== undefined) {
            filters.startDateTo = this.parseDateQuery(query.startDateTo, "startDateTo");
        }

        if (query.businessId !== undefined) {
            filters.businessId = query.businessId.trim();
        }

        if (query.customerId !== undefined) {
            filters.customerId = query.customerId.trim();
        }

        if (query.serviceResourceId !== undefined) {
            filters.serviceResourceId = query.serviceResourceId.trim();
        }

        if (query.email !== undefined) {
            filters.email = query.email.trim();
        }

        if (query.phone !== undefined) {
            filters.phone = query.phone.trim();
        }

        if (query.customerName !== undefined) {
            filters.customerName = query.customerName.trim();
        }

        return filters;
    }

    private parseListOptions(query: BookingListQuery): BookingListOptions {
        const page = this.parsePositiveInteger(query.page, defaultListOptions.page, "page");
        const limit = Math.min(this.parsePositiveInteger(query.limit, defaultListOptions.limit, "limit"), 100);
        const sortBy = query.sortBy ?? defaultListOptions.sortBy;
        const sortOrder = query.sortOrder ?? defaultListOptions.sortOrder;

        if (!bookingSortFields.includes(sortBy as BookingSortField)) {
            throw new Error("Invalid booking list query: sortBy is not supported");
        }

        if (!sortOrders.includes(sortOrder as SortOrder)) {
            throw new Error("Invalid booking list query: sortOrder is not supported");
        }

        return {
            page,
            limit,
            sortBy: sortBy as BookingSortField,
            sortOrder: sortOrder as SortOrder,
        };
    }

    private parseInsightsFilters(query: BookingInsightsQuery): BookingListFilters {
        const filters: BookingListFilters = {};

        if (query.startDateFrom !== undefined) {
            filters.startDateFrom = this.parseDateQuery(query.startDateFrom, "startDateFrom");
        }

        if (query.startDateTo !== undefined) {
            filters.startDateTo = this.parseDateQuery(query.startDateTo, "startDateTo");
        }

        if (query.businessId !== undefined) {
            filters.businessId = query.businessId.trim();
        }

        if (query.serviceResourceId !== undefined) {
            filters.serviceResourceId = query.serviceResourceId.trim();
        }

        return filters;
    }

    private parsePositiveInteger(value: string | undefined, fallback: number, fieldName: string): number {
        if (value === undefined) {
            return fallback;
        }

        const parsedValue = Number(value);
        if (!Number.isInteger(parsedValue) || parsedValue < 1) {
            throw new Error(`Invalid booking list query: ${fieldName} must be a positive integer`);
        }

        return parsedValue;
    }

    private parseDateQuery(value: string, fieldName: string): Date {
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid booking list query: ${fieldName} must be a valid date`);
        }

        return parsedDate;
    }

    private toRate(count: number, total: number): number {
        return Number(((count / total) * 100).toFixed(2));
    }

    private calculateDurationMinutes(start?: Date, end?: Date): number {
        if (!(start instanceof Date) || !(end instanceof Date)) {
            return 0;
        }

        return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
    }

    private buildHourSlotLabel(date: Date): string {
        return `${date.getUTCHours().toString().padStart(2, "0")}:00`;
    }

    private buildReasonBreakdown(
        bookings: Array<{ statusHistory?: BookingStatusAuditEntry[] }>,
        targetStatus: BookingStatus,
    ): BookingInsightsReasonBreakdown[] {
        const counts = new Map<string, number>();

        for (const booking of bookings) {
            const matchingEntry = [...(booking.statusHistory ?? [])]
                .reverse()
                .find((entry) => entry.toStatus === targetStatus);
            const reason = matchingEntry?.reason?.trim() || "Unspecified";
            counts.set(reason, (counts.get(reason) ?? 0) + 1);
        }

        return [...counts.entries()]
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count }));
    }

    private buildWeekdayBreakdown(
        bookings: Array<{ status: BookingStatus; startDate: Date }>,
    ): Array<{ weekday: string; cancellations: number; noShows: number }> {
        const counts = weekdayLabels.map((weekday) => ({
            weekday,
            cancellations: 0,
            noShows: 0,
        }));

        for (const booking of bookings) {
            const weekdayIndex = booking.startDate.getUTCDay();
            if (weekdayIndex < 0 || weekdayIndex >= counts.length) {
                continue;
            }

            if (booking.status === "cancelled") {
                counts[weekdayIndex].cancellations += 1;
            }

            if (booking.status === "no_show") {
                counts[weekdayIndex].noShows += 1;
            }
        }

        return counts;
    }

    private buildSuggestionBooking(request: BookingSuggestionRequest): IBooking {
        const startDate = this.parseSuggestionDate(request.startDate, "startDate");
        const endDate = this.parseSuggestionDate(request.endDate, "endDate");
        const timein = this.parseSuggestionDate(request.timein, "timein");
        const timeout = this.parseSuggestionDate(request.timeout, "timeout");

        if (endDate <= startDate) {
            throw new Error("Invalid booking suggestion request: endDate must be after startDate");
        }

        if (timeout <= timein) {
            throw new Error("Invalid booking suggestion request: timeout must be after timein");
        }

        return {
            businessId: request.businessId as unknown as mongoose.Types.ObjectId | undefined,
            serviceResourceId: request.serviceResourceId as unknown as mongoose.Types.ObjectId | undefined,
            partySize: request.partySize ?? 1,
            startDate,
            endDate,
            timein,
            timeout,
            status: "pending",
            userId: new mongoose.Types.ObjectId(),
            fName: "Suggestion",
            lName: "Request",
            gender: "prefer not to say",
            email: "suggestions@slotwise.local",
            phone: "+10000000000",
            _id: new mongoose.Types.ObjectId(),
        } as IBooking;
    }

    private parseSuggestionDate(value: string, fieldName: string): Date {
        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new Error(`Invalid booking suggestion request: ${fieldName} must be a valid date`);
        }

        return parsedDate;
    }

    private buildSuggestionCandidateOffsets(slotIntervalMinutes: number, searchWindowDays: number): Array<{ totalMinutes: number }> {
        const offsets: Array<{ totalMinutes: number }> = [{ totalMinutes: 0 }];
        const sameDaySteps = 8;
        const laterDaySteps = 3;
        const dayMinutes = 24 * 60;

        for (let step = 1; step <= sameDaySteps; step += 1) {
            offsets.push({ totalMinutes: step * slotIntervalMinutes });
            offsets.push({ totalMinutes: -step * slotIntervalMinutes });
        }

        for (let dayOffset = 1; dayOffset <= searchWindowDays; dayOffset += 1) {
            offsets.push({ totalMinutes: dayOffset * dayMinutes });

            for (let step = 1; step <= laterDaySteps; step += 1) {
                offsets.push({ totalMinutes: dayOffset * dayMinutes + step * slotIntervalMinutes });
                offsets.push({ totalMinutes: dayOffset * dayMinutes - step * slotIntervalMinutes });
            }
        }

        return offsets;
    }

    private shiftBookingWindow(baseBooking: IBooking, totalMinutes: number): IBooking {
        const shiftMilliseconds = totalMinutes * 60_000;

        return {
            ...baseBooking,
            startDate: new Date(baseBooking.startDate.getTime() + shiftMilliseconds),
            endDate: new Date(baseBooking.endDate.getTime() + shiftMilliseconds),
            timein: new Date(baseBooking.timein.getTime() + shiftMilliseconds),
            timeout: new Date(baseBooking.timeout.getTime() + shiftMilliseconds),
        } as IBooking;
    }

    private isRecoverableSuggestionRejection(message: string): boolean {
        return [
            "The booking slot is not available.",
            "Booking does not meet the minimum advance notice",
            "Booking is too far in advance",
            "Booking falls within a blackout window",
            "Booking start time falls outside configured working hours",
            "Booking end time falls outside configured working hours",
            "Booking start time must align to the configured slot interval",
            "Booking party size exceeds the configured resource capacity",
        ].includes(message);
    }

    private scoreSuggestion(differenceMinutes: number, conflictRiskScore: number, slotIntervalMinutes: number): number {
        const proximityPenalty = Math.floor(differenceMinutes / Math.max(slotIntervalMinutes, 1)) * 4;
        const riskPenalty = Math.floor(conflictRiskScore / 5);
        return Math.max(1, 100 - proximityPenalty - riskPenalty);
    }

    private describeSuggestion(totalMinutes: number): string {
        if (totalMinutes === 0) {
            return "Requested slot is currently available.";
        }

        const absoluteMinutes = Math.abs(totalMinutes);
        const dayMinutes = 24 * 60;
        const direction = totalMinutes > 0 ? "later" : "earlier";

        if (absoluteMinutes < dayMinutes) {
            return `Available on the same day ${absoluteMinutes} minutes ${direction} than requested.`;
        }

        const dayOffset = Math.floor(absoluteMinutes / dayMinutes);
        const remainderMinutes = absoluteMinutes % dayMinutes;
        const remainderText = remainderMinutes === 0 ? "at the same time" : `${remainderMinutes} minutes ${direction}`;
        return `Available ${dayOffset} day${dayOffset === 1 ? "" : "s"} ${direction}, ${remainderText}.`;
    }

    private ensureStatusHistory(booking: IBooking | null): IBooking | null {
        if (!booking) {
            return null;
        }

        if (!booking.statusHistory || booking.statusHistory.length === 0) {
            booking.statusHistory = [this.createLegacyStatusHistoryEntry(booking.status, booking.createdAt)];
        }

        return booking;
    }

    private async decorateBookingForResponse(booking: IBooking | null): Promise<IBooking | null> {
        if (!booking) {
            return null;
        }

        const decoratedBooking = this.toPlainBookingData(booking) as IBooking;
        this.ensureStatusHistory(decoratedBooking);
        decoratedBooking.conflictRisk = await this.evaluateConflictRisk(decoratedBooking, String(decoratedBooking._id));
        return decoratedBooking;
    }

    private async createConflictRiskSnapshot(booking: IBooking, excludeBookingId?: string): Promise<BookingConflictRisk> {
        return this.evaluateConflictRisk(booking, excludeBookingId);
    }

    private async evaluateConflictRisk(booking: IBooking, excludeBookingId?: string): Promise<BookingConflictRisk> {
        const signals: BookingConflictRiskSignal[] = [];
        const now = Date.now();
        const bookingStartTimestamp = booking.timein instanceof Date && !Number.isNaN(booking.timein.getTime())
            ? booking.timein.getTime()
            : null;
        const bookingCreatedTimestamp = booking.createdAt instanceof Date && !Number.isNaN(booking.createdAt.getTime())
            ? booking.createdAt.getTime()
            : null;
        const bookingStartsInMs = bookingStartTimestamp === null ? null : bookingStartTimestamp - now;
        const bookingAgeMs = bookingCreatedTimestamp === null ? null : now - bookingCreatedTimestamp;

        if (booking.status === "pending" && bookingStartsInMs !== null && bookingStartsInMs <= 6 * 60 * 60_000) {
            signals.push({
                code: "starts_soon",
                weight: 35,
                message: "Booking starts within the next 6 hours and may need immediate review.",
            });
        }

        if (booking.status === "pending" && bookingAgeMs !== null && bookingAgeMs >= 24 * 60 * 60_000) {
            signals.push({
                code: "approval_stale",
                weight: 20,
                message: "Booking has remained pending for more than 24 hours.",
            });
        }

        if ((booking.rescheduleHistory?.length ?? 0) >= 2) {
            signals.push({
                code: "repeat_reschedule",
                weight: 30,
                message: "Booking has already been rescheduled multiple times.",
            });
        }

        if ((booking.partySize ?? 1) >= 8) {
            signals.push({
                code: "large_party",
                weight: 15,
                message: "Large party size may increase operational coordination risk.",
            });
        }

        const conflictRiskContext = await this.bookingRepository.getConflictRiskContext(
            booking.startDate,
            booking.endDate,
            booking.timein,
            booking.timeout,
            this.buildConflictRiskAvailabilityContext(booking, excludeBookingId),
        );

        if (conflictRiskContext.adjacentBookingCount > 0 && conflictRiskContext.minimumGapMinutes !== null && conflictRiskContext.minimumGapMinutes <= 30) {
            signals.push({
                code: "tight_turnaround",
                weight: 20,
                message: "Nearby bookings leave a tight turnaround window around this slot.",
            });
        }

        if (conflictRiskContext.sameDayActiveBookingCount >= 5) {
            signals.push({
                code: "heavy_day_load",
                weight: 15,
                message: "This resource or business already has a heavy active booking load for the day.",
            });
        }

        const score = Math.min(100, signals.reduce((total, signal) => total + signal.weight, 0));
        const level = score >= 60 ? "high" : score >= 20 ? "medium" : "low";

        return {
            level,
            score,
            evaluatedAt: new Date(),
            summary: signals.length > 0
                ? `${signals.length} operational risk signal${signals.length === 1 ? "" : "s"} detected.`
                : "No elevated operational conflict signals detected.",
            signals,
        };
    }

    private buildConflictRiskAvailabilityContext(booking: IBooking, excludeBookingId?: string): BookingAvailabilityContext {
        return {
            businessId: booking.businessId ? String(booking.businessId) : undefined,
            serviceResourceId: booking.serviceResourceId ? String(booking.serviceResourceId) : undefined,
            excludeBookingId,
        };
    }

    private createLegacyStatusHistoryEntry(status: BookingStatus, createdAt?: Date): BookingStatusAuditEntry {
        return this.createAuditEntry(status, status, {
            changedByRole: "system",
            reason: legacyStatusHistoryReason,
        }, createdAt);
    }

    private createAuditEntry(
        fromStatus: BookingStatus,
        toStatus: BookingStatus,
        context: BookingStatusChangeContext,
        changedAt: Date = new Date(),
    ): BookingStatusAuditEntry {
        return {
            fromStatus,
            toStatus,
            changedAt,
            changedByRole: context.changedByRole,
            ...(context.changedBy ? { changedBy: context.changedBy } : {}),
            ...(context.reason ? { reason: context.reason } : {}),
        };
    }

    private createRescheduleEntry(
        existingBooking: IBooking,
        mergedBooking: IBooking,
        context: BookingRescheduleContext,
    ): BookingRescheduleEntry {
        return {
            previousStartDate: existingBooking.startDate,
            previousEndDate: existingBooking.endDate,
            previousTimein: existingBooking.timein,
            previousTimeout: existingBooking.timeout,
            newStartDate: mergedBooking.startDate,
            newEndDate: mergedBooking.endDate,
            newTimein: mergedBooking.timein,
            newTimeout: mergedBooking.timeout,
            rescheduledAt: new Date(),
            rescheduledByRole: context.changedByRole,
            ...(context.changedBy ? { rescheduledBy: context.changedBy } : {}),
            ...(context.reason ? { reason: context.reason } : {}),
        };
    }

    private mergeAvailabilityRules(
        baseRules: AvailabilityRules,
        overrides?: Partial<AvailabilityRules> | null,
    ): AvailabilityRules {
        return {
            ...baseRules,
            ...(overrides ?? {}),
        };
    }

    private validateAdvanceWindow(bookingData: IBooking, availabilityRules: AvailabilityRules): void {
        const now = Date.now();
        const bookingLeadMinutes = (bookingData.timein.getTime() - now) / 60_000;
        const bookingLeadDays = (bookingData.startDate.getTime() - now) / 86_400_000;

        if (bookingLeadMinutes < availabilityRules.minAdvanceMinutes) {
            throw new Error("Booking does not meet the minimum advance notice");
        }

        if (bookingLeadDays > availabilityRules.maxAdvanceDays) {
            throw new Error("Booking is too far in advance");
        }
    }

    private validateBlackoutDates(bookingData: IBooking, blackoutDates: BlackoutDate[]): void {
        const overlapsBlackout = blackoutDates.some((blackoutDate) => (
            bookingData.startDate <= blackoutDate.endDate
            && bookingData.endDate >= blackoutDate.startDate
        ));

        if (overlapsBlackout) {
            throw new Error("Booking falls within a blackout window");
        }
    }

    private validateWorkingHours(bookingData: IBooking, timezone: string, workingHours: WorkingHour[]): void {
        if (workingHours.length === 0) {
            return;
        }

        this.assertTimeWithinWorkingHours(bookingData.timein, timezone, workingHours, "Booking start time");
        this.assertTimeWithinWorkingHours(bookingData.timeout, timezone, workingHours, "Booking end time");
    }

    private validateSlotInterval(bookingData: IBooking, availabilityRules: AvailabilityRules): void {
        const minutesSinceMidnight = bookingData.timein.getUTCHours() * 60 + bookingData.timein.getUTCMinutes();
        if (minutesSinceMidnight % availabilityRules.slotIntervalMinutes !== 0) {
            throw new Error("Booking start time must align to the configured slot interval");
        }
    }

    private validateCapacity(bookingData: IBooking, serviceResource: IServiceResource | null): void {
        const requestedPartySize = bookingData.partySize ?? 1;

        if (serviceResource && requestedPartySize > serviceResource.capacity) {
            throw new Error("Booking party size exceeds the configured resource capacity");
        }
    }

    private assertTimeWithinWorkingHours(
        date: Date,
        timezone: string,
        workingHours: WorkingHour[],
        label: string,
    ): void {
        const weekdayName = date.toLocaleDateString("en-US", {
            weekday: "short",
            timeZone: timezone,
        });
        const dayOfWeek = weekdayNameToNumber[weekdayName];

        if (dayOfWeek === undefined) {
            throw new Error("Configured business timezone is invalid");
        }

        const activeWorkingHour = workingHours.find((workingHour) => workingHour.dayOfWeek === dayOfWeek);
        if (!activeWorkingHour || activeWorkingHour.closed) {
            throw new Error(`${label} falls outside configured working hours`);
        }

        const timeValue = date.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
        });
        const currentMinutes = this.parseClockToMinutes(timeValue);
        const startMinutes = this.parseClockToMinutes(activeWorkingHour.startTime);
        const endMinutes = this.parseClockToMinutes(activeWorkingHour.endTime);

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            throw new Error(`${label} falls outside configured working hours`);
        }
    }

    private buildNotificationPlan(
        bookingData: IBooking,
        business: IBusinessProfile,
        customer: ICustomer | null,
    ): BookingNotificationPlan {
        const customerChannels = customer?.preferredNotificationChannels ?? [];
        const channels = this.resolveNotificationChannels(business.notificationSettings.enabledChannels, customerChannels);
        const reminderSendAt = business.notificationSettings.reminderLeadHours
            .map((leadHours) => new Date(bookingData.timein.getTime() - leadHours * 60 * 60_000))
            .filter((reminderDate) => reminderDate.getTime() > Date.now());
        const now = new Date();

        return {
            channels,
            reminderSendAt,
            ...(business.notificationSettings.sendBookingConfirmation
                ? { confirmationPlannedAt: now }
                : {}),
            lastPlannedAt: now,
        };
    }

    private async enqueueBookingNotificationJobs(
        booking: IBooking,
        businessName: string | undefined,
        template: "booking_confirmation" | "booking_cancellation" | "booking_reschedule",
        availableAtDates: Date[],
    ): Promise<void> {
        if (!booking.notificationPlan?.channels.includes("email") || availableAtDates.length === 0) {
            return;
        }

        for (const availableAt of availableAtDates) {
            await this.notificationJobRepository.create({
                jobId: createSessionId(),
                channel: "email",
                provider: this.getNotificationProvider(),
                template,
                recipient: booking.email,
                payload: {
                    bookingId: String(booking._id),
                    businessName: businessName ?? "Slotwise",
                    customerName: `${booking.fName} ${booking.lName}`.trim(),
                    startDate: booking.startDate.toISOString(),
                    timein: booking.timein.toISOString(),
                },
                dedupeKey: `${template}:${String(booking._id)}:${availableAt.toISOString()}`,
                availableAt,
            });
        }
    }

    private async buildStatusNotificationPlan(
        booking: IBooking,
        status: BookingStatus,
    ): Promise<BookingNotificationPlan | undefined> {
        if (!booking.businessId || !booking.notificationPlan || status !== "cancelled") {
            return booking.notificationPlan;
        }

        const business = await this.businessProfileRepository.findById(String(booking.businessId));
        if (!business || !business.notificationSettings.sendCancellationNotice) {
            return booking.notificationPlan;
        }

        return {
            ...booking.notificationPlan,
            cancellationNoticePlannedAt: new Date(),
            lastPlannedAt: new Date(),
        };
    }

    private resolveNotificationChannels(
        businessChannels: NotificationChannel[],
        customerChannels: NotificationChannel[],
    ): NotificationChannel[] {
        if (customerChannels.length === 0) {
            return businessChannels;
        }

        const preferredBusinessChannels = customerChannels.filter((channel) => businessChannels.includes(channel));
        return preferredBusinessChannels.length > 0 ? preferredBusinessChannels : businessChannels;
    }

    private parseClockToMinutes(value: string): number {
        const [hours, minutes] = value.split(":").map(Number);
        return hours * 60 + minutes;
    }

    private getNotificationProvider(): "resend" | "noop" {
        return getOptionalEnv("SLOTWISE_EMAIL_PROVIDER") === "resend" ? "resend" : "noop";
    }

    private async assertCustomerOwnsBooking(id: string, customerId: string): Promise<IBooking | null> {
        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            return null;
        }

        if (!booking.customerId || String(booking.customerId) !== customerId) {
            throw new Error("Customer is not authorized to manage this booking");
        }

        return booking;
    }

    private toPlainBookingData(booking: IBooking): Partial<IBooking> {
        if (typeof booking.toObject === "function") {
            return booking.toObject();
        }

        return { ...booking };
    }
}
