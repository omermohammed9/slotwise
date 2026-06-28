import express from 'express';
import {connectDB} from "./config/db";
import authRoute from "./routes/auth.routes";
import auditLogRoute from "./routes/audit-log.routes";
import healthRoute from "./routes/health.routes";
import businessProfileRoute from "./routes/business-profile.routes";
import bookingRoute from "./routes/booking.routes";
import customerRoute from "./routes/customer.routes";
import serviceResourceRoute from "./routes/service-resource.routes";
import {getPort, getTrustedProxySetting, isProductionRuntime, validateRuntimeConfig} from "./config/env";
import { allowConfiguredCors } from "./middleware/cors";
import { requireCsrfForCookieSession } from "./middleware/csrf";
import { errorMiddleware, notFoundMiddleware, requestIdMiddleware, requestLogMiddleware } from "./middleware/requestObservability";
import { log } from "./utils/logger";


export const createApp = () => {
    validateRuntimeConfig();

    const app = express();
    app.set("trust proxy", getTrustedProxySetting());
    app.use(requestIdMiddleware);
    app.use(requestLogMiddleware);
    app.use(allowConfiguredCors);
    app.use(express.json());
    app.use((req, res, next) => {
        if (isProductionRuntime() && req.headers["x-forwarded-proto"] && req.protocol !== "https") {
            res.status(400).json({ success: false, error: { message: "HTTPS is required", requestId: req.requestId } });
            return;
        }

        next();
    });
    app.use(requireCsrfForCookieSession);

    app.use(`/`, healthRoute);
    app.use(`/auth`, authRoute);
    app.use(`/audit-logs`, auditLogRoute);
    app.use(`/businesses`, businessProfileRoute);
    app.use(`/bookings`, bookingRoute);
    app.use(`/customers`, customerRoute);
    app.use(`/service-resources`, serviceResourceRoute);
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
};

export const startServer = async (): Promise<void> => {
    const port = getPort();
    await connectDB();
    const app = createApp();
    app.listen(port, () => log("info", "api_server_started", { port }));
};

if (require.main === module) {
    startServer().catch((error) => {
        log("error", "server_startup_failed", { error });
        process.exit(1);
    });
}
