import { Response } from "express";
import { randomBytes } from "crypto";
import { getCsrfCookieName, getSessionCookieName, isSessionCookieSecure } from "../config/env";

const sameSite = "Lax";

const serializeCookie = (
    name: string,
    value: string,
    options: {
        expires?: Date;
        httpOnly?: boolean;
        maxAgeSeconds?: number;
    } = {},
): string => {
    const parts = [
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
        "Path=/",
        `SameSite=${sameSite}`,
    ];

    if (options.httpOnly !== false) {
        parts.push("HttpOnly");
    }

    if (isSessionCookieSecure()) {
        parts.push("Secure");
    }

    if (options.maxAgeSeconds !== undefined) {
        parts.push(`Max-Age=${options.maxAgeSeconds}`);
    }

    if (options.expires) {
        parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    return parts.join("; ");
};

export const getSessionTokenFromCookieHeader = (cookieHeader: string | undefined): string | null => {
    if (!cookieHeader) {
        return null;
    }

    const cookieName = getSessionCookieName();
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

    for (const cookie of cookies) {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) {
            continue;
        }

        const name = decodeURIComponent(cookie.slice(0, separatorIndex));
        if (name !== cookieName) {
            continue;
        }

        return decodeURIComponent(cookie.slice(separatorIndex + 1));
    }

    return null;
};

export const setSessionCookie = (res: Response, token: string, expiresAt: Date): void => {
    if (typeof res.setHeader !== "function") {
        return;
    }

    res.setHeader(
        "Set-Cookie",
        serializeCookie(getSessionCookieName(), token, {
            expires: expiresAt,
            maxAgeSeconds: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
        }),
    );
};

export const clearSessionCookie = (res: Response): void => {
    if (typeof res.setHeader !== "function") {
        return;
    }

    res.setHeader(
        "Set-Cookie",
        serializeCookie(getSessionCookieName(), "", {
            expires: new Date(0),
            maxAgeSeconds: 0,
        }),
    );
};

export const createCsrfToken = (): string => randomBytes(32).toString("base64url");

export const getCsrfTokenFromCookieHeader = (cookieHeader: string | undefined): string | null => {
    if (!cookieHeader) {
        return null;
    }

    const cookieName = getCsrfCookieName();
    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

    for (const cookie of cookies) {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) {
            continue;
        }

        const name = decodeURIComponent(cookie.slice(0, separatorIndex));
        if (name === cookieName) {
            return decodeURIComponent(cookie.slice(separatorIndex + 1));
        }
    }

    return null;
};

export const setCsrfCookie = (res: Response, token: string, expiresAt?: Date): void => {
    if (typeof res.setHeader !== "function") {
        return;
    }

    const existingHeader = typeof res.getHeader === "function" ? res.getHeader("Set-Cookie") : undefined;
    const headers = Array.isArray(existingHeader)
        ? existingHeader
        : typeof existingHeader === "string"
            ? [existingHeader]
            : [];

    headers.push(serializeCookie(getCsrfCookieName(), token, {
        expires: expiresAt,
        httpOnly: false,
        ...(expiresAt ? { maxAgeSeconds: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)) } : {}),
    }));

    res.setHeader("Set-Cookie", headers);
};

export const clearCsrfCookie = (res: Response): void => {
    if (typeof res.setHeader !== "function") {
        return;
    }

    const existingHeader = typeof res.getHeader === "function" ? res.getHeader("Set-Cookie") : undefined;
    const headers = Array.isArray(existingHeader)
        ? existingHeader
        : typeof existingHeader === "string"
            ? [existingHeader]
            : [];

    headers.push(serializeCookie(getCsrfCookieName(), "", {
        expires: new Date(0),
        httpOnly: false,
        maxAgeSeconds: 0,
    }));

    res.setHeader("Set-Cookie", headers);
};
