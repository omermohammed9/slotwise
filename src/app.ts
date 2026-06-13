import express from 'express';
import {connectDB} from "./config/db";
import authRoute from "./routes/auth.routes";
import businessProfileRoute from "./routes/business-profile.routes";
import bookingRoute from "./routes/booking.routes";
import customerRoute from "./routes/customer.routes";
import serviceResourceRoute from "./routes/service-resource.routes";
import {getPort} from "./config/env";


const app = express();
app.use(express.json());

app.use(`/auth`, authRoute)
app.use(`/businesses`, businessProfileRoute)
app.use(`/bookings`, bookingRoute)
app.use(`/customers`, customerRoute)
app.use(`/service-resources`, serviceResourceRoute)

const port = getPort();

connectDB()
    .then(async () => {
        const { AuthService } = await import("./services/auth.service");
        const { NotificationOutboxService } = await import("./services/notification-outbox.service");
        await AuthService.getInstance().bootstrapOperatorAccountsFromEnv();
        const notificationOutboxService = NotificationOutboxService.getInstance();
        notificationOutboxService.start();

        process.once("SIGINT", () => notificationOutboxService.stop());
        process.once("SIGTERM", () => notificationOutboxService.stop());
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    })
    .catch((error) => {
        console.error("Server startup failed:", error instanceof Error ? error.message : error);
        process.exit(1);
    });
