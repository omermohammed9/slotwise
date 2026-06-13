import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { BookingRepository } from "../repositories/booking.repository";

const run = async (): Promise<void> => {
    await connectDB();

    try {
        const result = await BookingRepository.getInstance().backfillBookingMetadata();
        console.log(
            "Booking metadata backfill complete:",
            JSON.stringify(result),
        );
    } finally {
        await mongoose.disconnect();
    }
};

run().catch((error) => {
    console.error(
        "Booking metadata backfill failed:",
        error instanceof Error ? error.message : error,
    );
    process.exit(1);
});
