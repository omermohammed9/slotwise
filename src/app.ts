import express from 'express';
import {connectDB} from "./config/db";
import bookingRoute from "./routes/booking.routes";
import {getPort} from "./config/env";


const app = express();
app.use(express.json());

app.use(`/bookings`, bookingRoute)

const port = getPort();

connectDB()
    .then(() => {
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    })
    .catch((error) => {
        console.error("Server startup failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    });
