import {IBooking} from "../interfaces/booking.interface";
import bookingModel from "../models/booking.model";
import {verifyEmail} from "../utils/emailVerifier";


export class BookingService {
    private static instance: BookingService;
    private constructor() {}

    public static getInstance(): BookingService {
        if (!BookingService.instance) {
            BookingService.instance = new BookingService();
        }
        return BookingService.instance;
    }

    private async validateEmailAddress(email: string): Promise<void> {
        const emailVerificationResult = await verifyEmail(email);

        if (
            emailVerificationResult.data.result !== 'deliverable'
            || emailVerificationResult.data.status !== 'valid'
            || emailVerificationResult.data.score < 40
            || emailVerificationResult.data.email !== email
        ) {
            throw new Error('Invalid email address');
        }
    }

     async checkAvailability(startDate: Date, endDate: Date): Promise<boolean> {
        const overlapBooking = await bookingModel.findOne({
            $or: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } }, // Overlaps with the given dates
                // Add other conditions here if necessary
            ],
        });
        return !overlapBooking; // If there's an overlapping booking, availability is false
    };
    async createBooking(bookingData: IBooking): Promise<IBooking | null> {
        await this.validateEmailAddress(bookingData.email);

        // Check availability first
        const isAvailable = await this.checkAvailability(bookingData.startDate, bookingData.endDate);
        if (!isAvailable) {
            throw new Error('The booking slot is not available.');
        }
        try {
            const booking = new bookingModel(bookingData);
            await booking.save();
            return booking;
        } catch (error) {
            throw new Error('Error creating booking');
        }
    };
     async getAllBookings(): Promise<IBooking[]> {
        try {
            return await bookingModel.find();
        } catch (error) {
            throw new Error('Error getting bookings: ' + error);
        }
    };
     async getBookingById(id: string): Promise<IBooking | null> {
        try {
            return await bookingModel.findById(id);
        } catch (error) {
            throw new Error('Error getting booking');
        }
    };
     async updateBooking(id: string, bookingData: Partial<IBooking>): Promise<IBooking | null> {
         if (bookingData.email !== undefined) {
             await this.validateEmailAddress(bookingData.email);
         }

         try {
            return await bookingModel.findByIdAndUpdate(id, bookingData, {
                new: true,
                runValidators: true
            });
        } catch (error) {
            throw new Error('Error updating booking');
        }
    };

    async deleteBooking(id: string): Promise<boolean> {
        try {
            const deletedBooking = await bookingModel.findByIdAndDelete(id);
            return deletedBooking !== null;
        } catch (error) {
            throw new Error('Error deleting booking');
        }
    };
}
