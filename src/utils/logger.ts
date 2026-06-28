export type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const redact = (value: unknown): unknown => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
        };
    }

    return value;
};

export const log = (level: LogLevel, message: string, fields: LogFields = {}): void => {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, redact(value)])),
    };

    const serialized = JSON.stringify(entry);

    if (level === "error") {
        console.error(serialized);
        return;
    }

    if (level === "warn") {
        console.warn(serialized);
        return;
    }

    console.log(serialized);
};
