import { BookingStatus, BookingStatusAuditEntry, IBooking } from "../interfaces/booking.interface";
import bookingModel from "../models/booking.model";
import {
    buildBookingSearchFields,
    buildCaseInsensitivePrefixSearchRegex,
    buildLoosePhoneSearchRegex,
    buildPrefixSearchRegex,
    normalizeEmailSearch,
    normalizeNameSearch,
    normalizePhoneSearch,
} from "../utils/searchNormalization";

export type BookingSortField = 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'status';
export type SortOrder = 'asc' | 'desc';

export interface BookingListFilters {
    status?: BookingStatus;
    conflictRiskLevel?: "low" | "medium" | "high";
    startDateFrom?: Date;
    startDateTo?: Date;
    businessId?: string;
    customerId?: string;
    serviceResourceId?: string;
    email?: string;
    phone?: string;
    customerName?: string;
}

export interface BookingListOptions {
    page: number;
    limit: number;
    sortBy: BookingSortField;
    sortOrder: SortOrder;
}

export interface BookingListResult {
    data: IBooking[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    sort: {
        sortBy: BookingSortField;
        sortOrder: SortOrder;
    };
}

export interface BookingMetadataBackfillResult {
    normalizedSearchFieldsUpdated: number;
    statusHistoryEntriesBackfilled: number;
}

export interface BookingInsightsSourceRecord {
    status: BookingStatus;
    startDate: Date;
    timein?: Date;
    timeout?: Date;
    partySize?: number;
    serviceResourceId?: IBooking["serviceResourceId"];
    businessId?: IBooking["businessId"];
    statusHistory?: IBooking["statusHistory"];
}

export interface BookingConflictRiskContext {
    adjacentBookingCount: number;
    minimumGapMinutes: number | null;
    sameDayActiveBookingCount: number;
}

export interface BookingAvailabilityContext {
    businessId?: string;
    serviceResourceId?: string;
    excludeBookingId?: string;
    bufferBeforeMinutes?: number;
    bufferAfterMinutes?: number;
}

export interface BookingRepositoryContract {
    findOverlapping(
        startDate: Date,
        endDate: Date,
        timein: Date,
        timeout: Date,
        context?: BookingAvailabilityContext,
    ): Promise<IBooking | null>;
    create(bookingData: IBooking): Promise<IBooking>;
    findAll(filters?: BookingListFilters, options?: BookingListOptions): Promise<BookingListResult>;
    findById(id: string): Promise<IBooking | null>;
    updateById(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null>;
    updateStatusById(
        id: string,
        status: BookingStatus,
        auditEntries: BookingStatusAuditEntry[],
        additionalUpdates?: Partial<IBooking>,
    ): Promise<IBooking | null>;
    getConflictRiskContext(
        startDate: Date,
        endDate: Date,
        timein: Date,
        timeout: Date,
        context?: BookingAvailabilityContext,
    ): Promise<BookingConflictRiskContext>;
    findInsightsSource(filters?: BookingListFilters): Promise<BookingInsightsSourceRecord[]>;
    deleteById(id: string): Promise<boolean>;
    backfillBookingMetadata(): Promise<BookingMetadataBackfillResult>;
}

export class BookingRepository implements BookingRepositoryContract {
    private static instance: BookingRepository;

    public constructor() {}

    public static getInstance(): BookingRepository {
        if (!BookingRepository.instance) {
            BookingRepository.instance = new BookingRepository();
        }

        return BookingRepository.instance;
    }

    public async findOverlapping(
        startDate: Date,
        endDate: Date,
        timein: Date,
        timeout: Date,
        context: BookingAvailabilityContext = {},
    ): Promise<IBooking | null> {
        const adjustedTimein = new Date(timein.getTime() - (context.bufferBeforeMinutes ?? 0) * 60_000);
        const adjustedTimeout = new Date(timeout.getTime() + (context.bufferAfterMinutes ?? 0) * 60_000);
        const query: Record<string, unknown> = {
            status: { $in: ["pending", "approved"] },
            $and: [
                { startDate: { $lte: endDate } },
                { endDate: { $gte: startDate } },
                { timein: { $lt: adjustedTimeout } },
                { timeout: { $gt: adjustedTimein } },
            ],
        };

        if (context.excludeBookingId) {
            query._id = { $ne: context.excludeBookingId };
        }

        if (context.serviceResourceId) {
            query.serviceResourceId = context.serviceResourceId;
        } else if (context.businessId) {
            query.businessId = context.businessId;
        }

        return bookingModel.findOne(query);
    }

    public async create(bookingData: IBooking): Promise<IBooking> {
        const booking = new bookingModel({
            ...bookingData,
            ...buildBookingSearchFields(bookingData),
        });
        await booking.save();
        return booking;
    }

    public async findAll(
        filters: BookingListFilters = {},
        options: BookingListOptions = {
            page: 1,
            limit: 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        },
    ): Promise<BookingListResult> {
        const query = this.buildListQuery(filters);
        const skip = (options.page - 1) * options.limit;
        const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
        const [data, total] = await Promise.all([
            bookingModel.find(query)
                .sort({ [options.sortBy]: sortDirection })
                .skip(skip)
                .limit(options.limit),
            bookingModel.countDocuments(query),
        ]);

        return {
            data,
            pagination: {
                page: options.page,
                limit: options.limit,
                total,
                totalPages: Math.ceil(total / options.limit),
            },
            sort: {
                sortBy: options.sortBy,
                sortOrder: options.sortOrder,
            },
        };
    }

    public async findById(id: string): Promise<IBooking | null> {
        return bookingModel.findById(id);
    }

    public async updateById(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
        return bookingModel.findByIdAndUpdate(id, {
            ...bookingData,
            ...buildBookingSearchFields(bookingData),
        }, {
            returnDocument: "after",
            runValidators: true,
        });
    }

    public async updateStatusById(
        id: string,
        status: BookingStatus,
        auditEntries: BookingStatusAuditEntry[],
        additionalUpdates: Partial<IBooking> = {},
    ): Promise<IBooking | null> {
        return bookingModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    status,
                    ...additionalUpdates,
                },
                $push: { statusHistory: { $each: auditEntries } },
            },
            {
                returnDocument: "after",
                runValidators: true,
            },
        );
    }

    public async getConflictRiskContext(
        startDate: Date,
        endDate: Date,
        timein: Date,
        timeout: Date,
        context: BookingAvailabilityContext = {},
    ): Promise<BookingConflictRiskContext> {
        if (!context.businessId && !context.serviceResourceId) {
            return {
                adjacentBookingCount: 0,
                minimumGapMinutes: null,
                sameDayActiveBookingCount: 0,
            };
        }

        const baseQuery = this.buildScopedActiveQuery(context);
        const dayStart = new Date(startDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(startDate);
        dayEnd.setUTCHours(23, 59, 59, 999);

        const adjacentWindowStart = new Date(timein.getTime() - 60 * 60_000);
        const adjacentWindowEnd = new Date(timeout.getTime() + 60 * 60_000);

        const [sameDayActiveBookingCount, adjacentBookings] = await Promise.all([
            bookingModel.countDocuments({
                ...baseQuery,
                $and: [
                    { startDate: { $lte: dayEnd } },
                    { endDate: { $gte: dayStart } },
                ],
            }),
            bookingModel.find({
                ...baseQuery,
                $or: [
                    {
                        timeout: { $gte: adjacentWindowStart, $lte: timein },
                    },
                    {
                        timein: { $gte: timeout, $lte: adjacentWindowEnd },
                    },
                ],
            }).select("timein timeout"),
        ]);

        const minimumGapMinutes = adjacentBookings.reduce<number | null>((currentMinimum, booking) => {
            const gapMilliseconds = booking.timeout && booking.timeout <= timein
                ? timein.getTime() - booking.timeout.getTime()
                : booking.timein && booking.timein >= timeout
                    ? booking.timein.getTime() - timeout.getTime()
                    : null;

            if (gapMilliseconds === null) {
                return currentMinimum;
            }

            const gapMinutes = Math.round(gapMilliseconds / 60_000);
            if (currentMinimum === null || gapMinutes < currentMinimum) {
                return gapMinutes;
            }

            return currentMinimum;
        }, null);

        return {
            adjacentBookingCount: adjacentBookings.length,
            minimumGapMinutes,
            sameDayActiveBookingCount,
        };
    }

    public async findInsightsSource(filters: BookingListFilters = {}): Promise<BookingInsightsSourceRecord[]> {
        const query = this.buildListQuery(filters);
        return bookingModel.find(query).select("status startDate timein timeout partySize serviceResourceId businessId statusHistory");
    }

    public async deleteById(id: string): Promise<boolean> {
        const deletedBooking = await bookingModel.findByIdAndDelete(id);
        return deletedBooking !== null;
    }

    public async backfillBookingMetadata(): Promise<BookingMetadataBackfillResult> {
        const normalizedSearchFieldsUpdated = await this.backfillSearchFields();
        const statusHistoryEntriesBackfilled = await this.backfillStatusHistory();

        return {
            normalizedSearchFieldsUpdated,
            statusHistoryEntriesBackfilled,
        };
    }

    private buildListQuery(filters: BookingListFilters): Record<string, unknown> {
        const query: Record<string, unknown> = {};
        const andConditions: Record<string, unknown>[] = [];

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.conflictRiskLevel) {
            query["conflictRisk.level"] = filters.conflictRiskLevel;
        }

        if (filters.startDateFrom || filters.startDateTo) {
            query.startDate = {
                ...(filters.startDateFrom ? { $gte: filters.startDateFrom } : {}),
                ...(filters.startDateTo ? { $lte: filters.startDateTo } : {}),
            };
        }

        if (filters.businessId) {
            query.businessId = filters.businessId;
        }

        if (filters.customerId) {
            query.customerId = filters.customerId;
        }

        if (filters.serviceResourceId) {
            query.serviceResourceId = filters.serviceResourceId;
        }

        if (filters.email) {
            const normalizedEmailRegex = buildPrefixSearchRegex(normalizeEmailSearch(filters.email));
            const rawEmailRegex = buildCaseInsensitivePrefixSearchRegex(filters.email.trim());
            andConditions.push({
                $or: [
                { emailNormalized: normalizedEmailRegex },
                { email: rawEmailRegex },
                ],
            });
        }

        if (filters.phone) {
            const normalizedPhone = normalizePhoneSearch(filters.phone);
            andConditions.push({
                $or: [
                { phoneNormalized: buildPrefixSearchRegex(normalizedPhone) },
                { phone: buildLoosePhoneSearchRegex(normalizedPhone) },
                ],
            });
        }

        if (filters.customerName) {
            const normalizedNameRegex = buildPrefixSearchRegex(normalizeNameSearch(filters.customerName));
            const rawNameRegex = buildCaseInsensitivePrefixSearchRegex(filters.customerName.trim());
            andConditions.push({
                $or: [
                { fNameNormalized: normalizedNameRegex },
                { lNameNormalized: normalizedNameRegex },
                { fName: rawNameRegex },
                { lName: rawNameRegex },
                ],
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        return query;
    }

    private buildScopedActiveQuery(context: BookingAvailabilityContext): Record<string, unknown> {
        const query: Record<string, unknown> = {
            status: { $in: ["pending", "approved"] },
        };

        if (context.excludeBookingId) {
            query._id = { $ne: context.excludeBookingId };
        }

        if (context.serviceResourceId) {
            query.serviceResourceId = context.serviceResourceId;
        } else if (context.businessId) {
            query.businessId = context.businessId;
        }

        return query;
    }

    private async backfillSearchFields(): Promise<number> {
        const bookingsMissingSearchFields = await bookingModel.find({
            $or: [
                { emailNormalized: { $exists: false } },
                { phoneNormalized: { $exists: false } },
                { fNameNormalized: { $exists: false } },
                { lNameNormalized: { $exists: false } },
            ],
        }).select("_id email phone fName lName");

        if (bookingsMissingSearchFields.length === 0) {
            return 0;
        }

        await bookingModel.bulkWrite(
            bookingsMissingSearchFields.map((booking) => ({
                updateOne: {
                    filter: { _id: booking._id },
                    update: { $set: buildBookingSearchFields(booking) },
                },
            })),
        );

        return bookingsMissingSearchFields.length;
    }

    private async backfillStatusHistory(): Promise<number> {
        const bookingsMissingStatusHistory = await bookingModel.find({
            $or: [
                { statusHistory: { $exists: false } },
                { statusHistory: { $size: 0 } },
            ],
        }).select("_id status createdAt");

        if (bookingsMissingStatusHistory.length === 0) {
            return 0;
        }

        await bookingModel.bulkWrite(
            bookingsMissingStatusHistory.map((booking) => ({
                updateOne: {
                    filter: { _id: booking._id },
                    update: {
                        $set: {
                            statusHistory: [{
                                fromStatus: booking.status,
                                toStatus: booking.status,
                                changedAt: booking.createdAt ?? new Date(),
                                changedByRole: "system",
                                reason: "Backfilled legacy booking status history",
                            }],
                        },
                    },
                },
            })),
        );

        return bookingsMissingStatusHistory.length;
    }
}
