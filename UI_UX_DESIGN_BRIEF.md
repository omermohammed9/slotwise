# Slotwise UI/UX Design Brief

## Product Direction
Slotwise should feel like a flexible, professional booking platform for any business that manages reservations, appointments, resources, spaces, services, or events. The interface should be attractive without becoming decorative, and it should support fast operational decisions.

## Experience Principles
- Make booking status, time, customer, and business context easy to scan.
- Keep operational workflows efficient for repeated daily use.
- Keep customer booking flows calm, clear, and mobile-friendly.
- Use polished visual hierarchy, readable typography, crisp spacing, and restrained status colors.
- Avoid marketing-style layouts inside the product experience.

## Admin Dashboard
- Booking queue with filters for status, date range, customer, service, and business/resource.
- Status cards for pending, approved, rejected, cancelled, and completed bookings.
- Calendar or timeline view for schedule density and conflicts.
- Booking detail drawer or page with customer details, booking window, status history, and actions.
- Approval, rejection, rescheduling, and cancellation actions after auth/role scope is defined.
- Customer profile view with booking history.
- Business settings for services/resources, working hours, blackout dates, and notification preferences.

## Customer Portal
- Business or service selection.
- Availability picker with clear date/time choices.
- Customer details form with inline validation.
- Confirmation screen with booking summary and next steps.
- Booking status lookup.
- Reschedule or cancellation request flow after policy rules are defined.

## Design System
- Colors: neutral base, strong contrast, restrained accent colors, and clear status colors.
- Typography: readable UI type with compact headings for operational screens.
- Components: buttons, inputs, selects, date/time pickers, tables, badges, dialogs, tabs, empty states, loading states, error states, and success states.
- Layout: responsive desktop, tablet, and mobile patterns with stable table and form dimensions.

## Accessibility
- All status colors must include text labels.
- Form errors must appear near the relevant field.
- Keyboard navigation must cover forms, tables, filters, and dialogs.
- Touch targets must remain usable on mobile and tablet screens.
- Contrast must remain readable in all dashboard and customer portal states.

## Deferred Implementation Decisions
- Frontend framework.
- UI component library.
- State management.
- Authentication UI.
- Deployment target.
