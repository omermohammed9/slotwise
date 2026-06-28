import express from "express";
import { BookingController } from "../controllers/booking.controller";
import {
    validateBookingId,
    validateBookingInsightsQuery,
    validateBookingListQuery,
    validateCustomerBookingAction,
    validateCreateBooking,
    validateBookingSuggestionsRequest,
    validateRescheduleBooking,
    validateUpdateBooking,
} from "../middleware/bookingRequestValidation";
import { requireBusinessScopeAccess, requireResolvedBusinessScopeAccess } from "../middleware/businessAuthorization";
import { requireRole } from "../middleware/requireRole";
import { BookingRepository } from "../repositories/booking.repository";


const router = express.Router();

const bookingController = new BookingController();
const bookingRepository = BookingRepository.getInstance();
const requireAdminRole = requireRole(['owner', 'admin']);
const requireStaffRole = requireRole(['owner', 'admin', 'staff']);
const requireCustomerRole = requireRole(['customer']);
const requireBookingBusinessScopeAccess = requireResolvedBusinessScopeAccess(async (req) => {
    if (typeof req.params.id !== "string") {
        return null;
    }

    const booking = await bookingRepository.findById(req.params.id);
    return booking?.businessId ? String(booking.businessId) : null;
});

router.post('/createbookings', validateCreateBooking, bookingController.createBooking);
router.get('/insights/dashboard', requireStaffRole, validateBookingInsightsQuery, requireBusinessScopeAccess, bookingController.getBookingDashboardInsights);
router.get('/insights/cancellation-no-show', requireStaffRole, validateBookingInsightsQuery, requireBusinessScopeAccess, bookingController.getCancellationNoShowInsights);
router.get('/timeline', requireStaffRole, validateBookingListQuery, requireBusinessScopeAccess, bookingController.getBookingTimeline);
router.get('/all', requireStaffRole, validateBookingListQuery, requireBusinessScopeAccess, bookingController.getAllBookings);
router.get('/get/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.getBookingById);
router.put('/update/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, validateUpdateBooking, bookingController.updateBooking);
router.patch('/approve/:id', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.approveBooking);
router.patch('/reject/:id', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.rejectBooking);
router.patch('/cancel/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.cancelBooking);
router.patch('/complete/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.completeBooking);
router.patch('/no-show/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.markBookingNoShow);
router.patch('/reschedule/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, validateRescheduleBooking, bookingController.rescheduleBooking);
router.post('/customer-cancel/:id', validateBookingId, requireCustomerRole, validateCustomerBookingAction, bookingController.customerCancelBooking);
router.post('/customer-reschedule/:id', validateBookingId, requireCustomerRole, validateCustomerBookingAction, validateRescheduleBooking, bookingController.customerRescheduleBooking);
router.delete('/delete/:id', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.deleteBooking);

router.post('/', validateCreateBooking, bookingController.createBooking);
router.get('/insights/dashboard', requireStaffRole, validateBookingInsightsQuery, requireBusinessScopeAccess, bookingController.getBookingDashboardInsights);
router.get('/insights/cancellation-no-show', requireStaffRole, validateBookingInsightsQuery, requireBusinessScopeAccess, bookingController.getCancellationNoShowInsights);
router.post('/suggestions', validateBookingSuggestionsRequest, bookingController.getBookingSuggestions);
router.get('/timeline', requireStaffRole, validateBookingListQuery, requireBusinessScopeAccess, bookingController.getBookingTimeline);
router.get('/', requireStaffRole, validateBookingListQuery, requireBusinessScopeAccess, bookingController.getAllBookings);
router.patch('/:id/approve', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.approveBooking);
router.patch('/:id/reject', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.rejectBooking);
router.patch('/:id/cancel', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.cancelBooking);
router.patch('/:id/complete', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.completeBooking);
router.patch('/:id/no-show', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.markBookingNoShow);
router.patch('/:id/reschedule', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, validateRescheduleBooking, bookingController.rescheduleBooking);
router.post('/:id/customer-cancel', validateBookingId, requireCustomerRole, validateCustomerBookingAction, bookingController.customerCancelBooking);
router.post('/:id/customer-reschedule', validateBookingId, requireCustomerRole, validateCustomerBookingAction, validateRescheduleBooking, bookingController.customerRescheduleBooking);
router.get('/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, bookingController.getBookingById);
router.patch('/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, validateUpdateBooking, bookingController.updateBooking);
router.put('/:id', validateBookingId, requireStaffRole, requireBookingBusinessScopeAccess, validateUpdateBooking, bookingController.updateBooking);
router.delete('/:id', validateBookingId, requireAdminRole, requireBookingBusinessScopeAccess, bookingController.deleteBooking);

export default router;
