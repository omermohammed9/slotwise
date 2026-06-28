import { NotificationTemplate } from "../interfaces/notification-job.interface";

export interface RenderedNotification {
    subject: string;
    text: string;
    html: string;
    sanitizedPayload?: Record<string, unknown>;
}

const safeString = (value: unknown, fallback: string): string => (
    typeof value === "string" && value.trim() ? value.trim() : fallback
);

export const renderNotificationTemplate = (
    template: NotificationTemplate,
    payload: Record<string, unknown>,
): RenderedNotification => {
    switch (template) {
        case "customer_magic_link": {
            const customerName = safeString(payload.customerName, "there");
            const magicLinkUrl = safeString(payload.magicLinkUrl, safeString(payload.token, ""));
            const expiresAt = safeString(payload.expiresAt, "soon");

            return {
                subject: "Your Slotwise sign-in link",
                text: `Hi ${customerName}, use this sign-in link: ${magicLinkUrl}. It expires at ${expiresAt}.`,
                html: `<p>Hi ${customerName},</p><p>Use this sign-in link:</p><p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p><p>It expires at ${expiresAt}.</p>`,
                sanitizedPayload: {
                    ...payload,
                    token: "[redacted-after-send]",
                    magicLinkUrl: "[redacted-after-send]",
                },
            };
        }

        case "operator_invitation": {
            const username = safeString(payload.username, "operator");
            const invitationUrl = safeString(payload.invitationUrl, safeString(payload.token, ""));
            const role = safeString(payload.role, "operator");
            const expiresAt = safeString(payload.expiresAt, "soon");

            return {
                subject: "Your Slotwise operator invitation",
                text: `Hi ${username}, you have been invited as a Slotwise ${role}. Set up your account here: ${invitationUrl}. This invitation expires at ${expiresAt}.`,
                html: `<p>Hi ${username},</p><p>You have been invited as a Slotwise ${role}.</p><p>Set up your account here: <a href="${invitationUrl}">${invitationUrl}</a></p><p>This invitation expires at ${expiresAt}.</p>`,
                sanitizedPayload: {
                    ...payload,
                    token: "[redacted-after-send]",
                    invitationUrl: "[redacted-after-send]",
                },
            };
        }

        case "operator_password_reset": {
            const username = safeString(payload.username, "operator");
            const resetUrl = safeString(payload.resetUrl, safeString(payload.token, ""));
            const expiresAt = safeString(payload.expiresAt, "soon");

            return {
                subject: "Reset your Slotwise operator password",
                text: `Hi ${username}, reset your Slotwise password here: ${resetUrl}. This reset link expires at ${expiresAt}.`,
                html: `<p>Hi ${username},</p><p>Reset your Slotwise password here: <a href="${resetUrl}">${resetUrl}</a></p><p>This reset link expires at ${expiresAt}.</p>`,
                sanitizedPayload: {
                    ...payload,
                    token: "[redacted-after-send]",
                    resetUrl: "[redacted-after-send]",
                },
            };
        }

        case "booking_confirmation":
        case "booking_cancellation":
        case "booking_reschedule":
        case "booking_reminder": {
            const customerName = safeString(payload.customerName, "customer");
            const businessName = safeString(payload.businessName, "Slotwise");
            const bookingDate = safeString(payload.startDate, "your scheduled time");
            const bookingTime = safeString(payload.timein, "");

            const subjectMap: Record<NotificationTemplate, string> = {
                customer_magic_link: "",
                operator_invitation: "",
                operator_password_reset: "",
                booking_confirmation: `Booking confirmed with ${businessName}`,
                booking_cancellation: `Booking cancelled with ${businessName}`,
                booking_reschedule: `Booking rescheduled with ${businessName}`,
                booking_reminder: `Booking reminder from ${businessName}`,
            };

            const bodyLeadMap: Record<Extract<NotificationTemplate, "booking_confirmation" | "booking_cancellation" | "booking_reschedule" | "booking_reminder">, string> = {
                booking_confirmation: "Your booking is confirmed.",
                booking_cancellation: "Your booking has been cancelled.",
                booking_reschedule: "Your booking has been rescheduled.",
                booking_reminder: "This is a reminder for your upcoming booking.",
            };

            const subject = subjectMap[template];
            const lead = bodyLeadMap[template];

            return {
                subject,
                text: `Hi ${customerName}, ${lead} Date: ${bookingDate}${bookingTime ? ` at ${bookingTime}` : ""}.`,
                html: `<p>Hi ${customerName},</p><p>${lead}</p><p>Date: ${bookingDate}${bookingTime ? ` at ${bookingTime}` : ""}</p>`,
            };
        }

        default:
            return {
                subject: "Slotwise notification",
                text: "A Slotwise notification is ready.",
                html: "<p>A Slotwise notification is ready.</p>",
            };
    }
};
