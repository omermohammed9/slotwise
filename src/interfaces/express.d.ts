import type { SlotwiseSession } from "./auth.interface";

declare global {
    namespace Express {
        interface Request {
            slotwiseSession?: SlotwiseSession;
            slotwiseSessionToken?: string;
            requestId?: string;
        }
    }
}

export {};
