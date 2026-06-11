import { Request, Response } from "express";
import {BookingService} from "../services/booking.service";


export class BookingController {
    private bookingService: BookingService;

    constructor() {
        this.bookingService = BookingService.getInstance();
    }

    public createBooking = async (req: Request, res: Response)=> {
        try {
            const bookingData = req.body;
            const booking = await this.bookingService.createBooking(bookingData);
            res.status(201).json(booking);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    public getAllBookings = async (req: Request, res: Response) => {
        try {
            const bookings = await this.bookingService.getAllBookings();
            res.status(200).json(bookings);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    public getBookingById = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const booking = await this.bookingService.getBookingById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(200).json(booking);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    public updateBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const bookingData = req.body;
            const booking = await this.bookingService.updateBooking(id, bookingData);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(200).json(booking);
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };

    public deleteBooking = async (req: Request<{ id: string }>, res: Response)=> {
        try {
            const { id } = req.params;
            const deleted = await this.bookingService.deleteBooking(id);
            if (!deleted) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ message: (error as Error).message });
        }
    };
}
