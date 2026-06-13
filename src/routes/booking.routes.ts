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
import { requireRole } from "../middleware/requireRole";


const router = express.Router();

const bookingController = new BookingController();
const requireAdminRole = requireRole(['owner', 'admin']);
const requireStaffRole = requireRole(['owner', 'admin', 'staff']);
const requireCustomerRole = requireRole(['customer']);

router.post('/createbookings', validateCreateBooking, bookingController.createBooking);
router.get('/insights/dashboard', validateBookingInsightsQuery, bookingController.getBookingDashboardInsights);
router.get('/insights/cancellation-no-show', validateBookingInsightsQuery, bookingController.getCancellationNoShowInsights);
router.get('/timeline', validateBookingListQuery, bookingController.getBookingTimeline);
router.get('/all', validateBookingListQuery, bookingController.getAllBookings);
router.get('/get/:id', validateBookingId, bookingController.getBookingById);
router.put('/update/:id', validateBookingId, validateUpdateBooking, bookingController.updateBooking);
router.patch('/approve/:id', validateBookingId, requireAdminRole, bookingController.approveBooking);
router.patch('/reject/:id', validateBookingId, requireAdminRole, bookingController.rejectBooking);
router.patch('/cancel/:id', validateBookingId, requireStaffRole, bookingController.cancelBooking);
router.patch('/complete/:id', validateBookingId, requireStaffRole, bookingController.completeBooking);
router.patch('/no-show/:id', validateBookingId, requireStaffRole, bookingController.markBookingNoShow);
router.patch('/reschedule/:id', validateBookingId, requireStaffRole, validateRescheduleBooking, bookingController.rescheduleBooking);
router.post('/customer-cancel/:id', validateBookingId, requireCustomerRole, validateCustomerBookingAction, bookingController.customerCancelBooking);
router.post('/customer-reschedule/:id', validateBookingId, requireCustomerRole, validateCustomerBookingAction, validateRescheduleBooking, bookingController.customerRescheduleBooking);
router.delete('/delete/:id', validateBookingId, bookingController.deleteBooking);

router.post('/', validateCreateBooking, bookingController.createBooking);
router.get('/insights/dashboard', validateBookingInsightsQuery, bookingController.getBookingDashboardInsights);
router.get('/insights/cancellation-no-show', validateBookingInsightsQuery, bookingController.getCancellationNoShowInsights);
router.post('/suggestions', validateBookingSuggestionsRequest, bookingController.getBookingSuggestions);
router.get('/timeline', validateBookingListQuery, bookingController.getBookingTimeline);
router.get('/', validateBookingListQuery, bookingController.getAllBookings);
router.patch('/:id/approve', validateBookingId, requireAdminRole, bookingController.approveBooking);
router.patch('/:id/reject', validateBookingId, requireAdminRole, bookingController.rejectBooking);
router.patch('/:id/cancel', validateBookingId, requireStaffRole, bookingController.cancelBooking);
router.patch('/:id/complete', validateBookingId, requireStaffRole, bookingController.completeBooking);
router.patch('/:id/no-show', validateBookingId, requireStaffRole, bookingController.markBookingNoShow);
router.patch('/:id/reschedule', validateBookingId, requireStaffRole, validateRescheduleBooking, bookingController.rescheduleBooking);
router.post('/:id/customer-cancel', validateBookingId, requireCustomerRole, validateCustomerBookingAction, bookingController.customerCancelBooking);
router.post('/:id/customer-reschedule', validateBookingId, requireCustomerRole, validateCustomerBookingAction, validateRescheduleBooking, bookingController.customerRescheduleBooking);
router.get('/:id', validateBookingId, bookingController.getBookingById);
router.patch('/:id', validateBookingId, validateUpdateBooking, bookingController.updateBooking);
router.put('/:id', validateBookingId, validateUpdateBooking, bookingController.updateBooking);
router.delete('/:id', validateBookingId, bookingController.deleteBooking);

export default router;
