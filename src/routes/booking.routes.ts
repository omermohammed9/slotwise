import express from "express";
import {BookingController} from "../controllers/booking.controller";


const router = express.Router();

const bookingController = new BookingController();
router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id', bookingController.updateBooking);
router.put('/:id', bookingController.updateBooking);
router.delete('/:id', bookingController.deleteBooking);

router.post('/createbookings', (req, res) => bookingController.createBooking(req, res));
router.get('/all', bookingController.getAllBookings);
router.get('/get/:id', bookingController.getBookingById);
router.put('/update/:id', bookingController.updateBooking);
router.delete('/delete/:id', (req, res)=>bookingController.deleteBooking(req, res));

export default router;
