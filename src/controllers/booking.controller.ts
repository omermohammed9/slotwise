import { Request, Response } from "express";
import { BookingService, BookingStatusChangeContext } from "../services/booking.service";
import { AuditLogService } from "../services/audit-log.service";
import { sendError, sendSuccess } from "../utils/apiResponse";


export class BookingController {
    private bookingService: BookingService;
    private auditLogService: AuditLogService;

    constructor(
        bookingService: BookingService = BookingService.getInstance(),
        auditLogService: AuditLogService = AuditLogService.getInstance(),
    ) {
        this.bookingService = bookingService;
        this.auditLogService = auditLogService;
    }

    public createBooking = async (req: Request, res: Response)=> {
        try {
            const bookingData = req.body;
            const booking = await this.bookingService.createBooking(bookingData);
            if (booking) {
                await this.recordBookingAudit(req, "booking.created", booking);
            }
            sendSuccess(res, 201, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getAllBookings = async (req: Request, res: Response) => {
        try {
            const bookings = await this.bookingService.getAllBookings(req.query);
            sendSuccess(res, 200, bookings.data, {
                pagination: bookings.pagination,
                sort: bookings.sort,
            });
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getBookingSuggestions = async (req: Request, res: Response) => {
        try {
            const suggestions = await this.bookingService.getBookingSuggestions(req.body);
            sendSuccess(res, 200, suggestions.data, suggestions.meta);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getCancellationNoShowInsights = async (req: Request, res: Response) => {
        try {
            const insights = await this.bookingService.getCancellationNoShowInsights(req.query);
            sendSuccess(res, 200, insights);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getBookingDashboardInsights = async (req: Request, res: Response) => {
        try {
            const insights = await this.bookingService.getBookingDashboardInsights(req.query);
            sendSuccess(res, 200, insights);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getBookingTimeline = async (req: Request, res: Response) => {
        try {
            const timeline = await this.bookingService.getBookingTimeline(req.query);
            sendSuccess(res, 200, timeline.data, timeline.meta);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public getBookingById = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.getBookingById(id);
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.updated", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public updateBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const bookingData = req.body;
            const booking = await this.bookingService.updateBooking(id, bookingData);
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public deleteBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const deleted = await this.bookingService.deleteBooking(id);
            if (!deleted) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.auditLogService.record({
                actor: req.slotwiseSession,
                action: "booking.deleted",
                targetEntity: "booking",
                targetId: id,
                requestId: req.requestId,
            });
            res.status(204).send();
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public approveBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.updateBookingStatus(id, 'approved', this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.approved", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public rejectBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.updateBookingStatus(id, 'rejected', this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.rejected", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public cancelBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.updateBookingStatus(id, 'cancelled', this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.cancelled", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public completeBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.updateBookingStatus(id, 'completed', this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.completed", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public markBookingNoShow = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.updateBookingStatus(id, 'no_show', this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.no_show", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public rescheduleBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.rescheduleBooking(id, req.body, this.getStatusChangeContext(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.rescheduled", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public customerCancelBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.cancelBookingAsCustomer(id, this.getCustomerBookingActionPayload(req));
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.customer_cancelled", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    public customerRescheduleBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.rescheduleBookingAsCustomer(id, {
                ...req.body,
                ...this.getCustomerBookingActionPayload(req),
            });
            if (!booking) {
                return sendError(res, 404, 'Booking not found');
            }
            await this.recordBookingAudit(req, "booking.customer_rescheduled", booking);
            sendSuccess(res, 200, booking);
        } catch (error) {
            sendError(res, 400, (error as Error).message);
        }
    };

    private getStatusChangeContext(req: Request): BookingStatusChangeContext {
        if (!req.slotwiseSession) {
            throw new Error("Authenticated session is required");
        }

        return {
            changedByRole: req.slotwiseSession.role,
            changedBy: req.slotwiseSession.actorId,
            ...(typeof req.body?.reason === 'string' && req.body.reason.trim()
                ? { reason: req.body.reason.trim() }
                : {}),
        };
    }

    private getCustomerBookingActionPayload(req: Request): { customerId: string; reason?: string } {
        if (!req.slotwiseSession || req.slotwiseSession.role !== "customer") {
            throw new Error("Authenticated customer session is required");
        }

        return {
            customerId: req.slotwiseSession.actorId,
            ...(typeof req.body?.reason === "string" && req.body.reason.trim()
                ? { reason: req.body.reason.trim() }
                : {}),
        };
    }

    private async recordBookingAudit(req: Request, action: string, booking: { _id?: unknown; businessId?: unknown }): Promise<void> {
        await this.auditLogService.record({
            actor: req.slotwiseSession,
            action,
            targetEntity: "booking",
            targetId: booking._id ? String(booking._id) : undefined,
            businessId: booking.businessId ? String(booking.businessId) : undefined,
            requestId: req.requestId,
        });
    }
}
