# Slotwise UI/UX Design Brief

## Product Direction
Slotwise should feel like a flexible, professional booking platform for any business that manages reservations, appointments, resources, spaces, services, or events. The interface should be attractive without becoming decorative, and it should support fast operational decisions.

## Experience Principles
- Make booking status, time, customer, and business context easy to scan.
- Keep operational workflows efficient for repeated daily use.
- Keep customer booking flows calm, clear, and mobile-friendly.
- Use polished visual hierarchy, readable typography, crisp spacing, and restrained status colors.
- Avoid marketing-style layouts inside the product experience.

## Brand Direction
- Brand character: professional, calm, capable, modern, and operationally trustworthy.
- Core tone: hospitality and clarity over hype; product screens should feel service-oriented rather than sales-oriented.
- Visual posture: light, structured layouts with strong content grouping, generous whitespace, and decisive hierarchy.
- Primary palette direction:
  - Base: warm white, graphite, slate, soft cloud gray.
  - Accent: deep teal or muted copper as the main product accent, chosen once and applied consistently.
  - Status: amber for pending, green for approved/completed, red for cancelled/rejected, and charcoal for archived or passive states.
- Surface direction:
  - Admin areas should use layered cards, subtle dividers, and quiet depth rather than heavy gradients.
  - Customer-facing pages can use slightly more warmth and imagery, but should remain clean and task-focused.
- Typography direction:
  - Headings should feel confident and compact.
  - Body text should optimize for operational readability, especially in dense lists, tables, and timeline views.

### Visual Language Tokens
- Shape language:
  - Prefer medium-radius corners, clean rectangular cards, and deliberate grid alignment over playful rounded-everything patterns.
  - Use larger radius only on customer-facing hero, confirmation, and input-group surfaces where warmth matters more.
- Elevation:
  - Reserve stronger shadows for floating drawers, command panels, and sticky mobile action bars.
  - Default content surfaces should rely more on border contrast and layered background tone than heavy shadow.
- Density model:
  - Admin surfaces should support three density levels in practice: summary, operational, and detail.
  - Customer surfaces should stay relaxed and low-density by default, especially around time-picking and confirmation content.
- Iconography:
  - Use simple outline or lightly filled icons with consistent stroke weight.
  - Icons should support scanability, not replace labels.
- Data visualization mood:
  - Charts should feel editorial and operational, using restrained fills, thin grid lines, and limited accent use.
  - Avoid neon analytics styling or decorative gradients that reduce trust.

## Admin Dashboard
- Booking queue with filters for status, date range, customer, service, and business/resource.
- Status cards for pending, approved, rejected, cancelled, and completed bookings.
- Calendar or timeline view for schedule density and conflicts.
- Booking detail drawer or page with customer details, booking window, status history, and actions.
- Approval, rejection, rescheduling, and cancellation actions after auth/role scope is defined.
- Customer profile view with booking history.
- Business settings for services/resources, working hours, blackout dates, and notification preferences.

### Admin Information Architecture
- Primary navigation:
  - Dashboard
  - Bookings
  - Timeline
  - Customers
  - Resources
  - Business Settings
- Secondary utility areas:
  - Search
  - Notification/activity center
  - Account/session menu
- Default landing behavior:
  - Owners/admins should land on a dashboard summary with alerts, pending actions, and a compact performance overview.
  - Staff users should land on today’s operational queue and timeline first.

### Admin Screen Priorities
- Dashboard home:
  - KPI strip, pending approvals, today’s timeline snapshot, and recent exceptions.
- Bookings list:
  - Dense sortable table, saved filters, bulk scanability, and quick action affordances.
- Timeline view:
  - Day/week density view, resource grouping, conflict emphasis, and timeline cards with status/risk chips.
- Booking detail panel:
  - Customer identity, booking window, notes, history, risk signals, and action buttons.
- Settings:
  - Service/resource management, availability rules, blackout dates, templates, widget/page settings, and notification preferences.

### Admin Screen Composition
- Dashboard shell:
  - Persistent left navigation, compact top utility bar, alert rail or summary band, and a flexible two-column body on desktop.
  - The first visible viewport should answer: what needs attention now, what is happening today, and what is slipping.
- Bookings workspace:
  - Use a split layout with filters/search on the left or top, a primary results table/timeline in the center, and contextual detail on demand.
  - Keep actions close to status and time context so operators do not need to scroll to understand consequences.
- Timeline view:
  - Prioritize time blocks, lane labels, conflict markers, and quick drill-in over decorative calendar chrome.
  - Make resource grouping, waitlist pressure, and back-to-back transitions legible at a glance.
- Detail drawer/page:
  - Open with the booking summary first, then customer/contact details, then operational metadata, then audit/history.
  - Sticky actions should remain available without covering critical booking information.

### Admin Interaction Patterns
- Filtering:
  - Saved views should feel first-class, especially for “Needs approval”, “Today”, “At risk”, and per-resource queues.
  - Applied filters should be visibly removable one by one without opening a full filter panel.
- Bulk review:
  - Bulk actions should exist only where consequences are obvious and reversible, with clear status previews before submission.
- Exception handling:
  - Conflict, stale approval, no-show, and repeated-reschedule signals should share one visual language across table rows, chips, and drawers.
- Activity awareness:
  - Recent status changes, reschedules, and customer actions should appear as digestible event rows rather than audit-log walls.

## Customer Portal
- Business or service selection.
- Availability picker with clear date/time choices.
- Customer details form with inline validation.
- Confirmation screen with booking summary and next steps.
- Booking status lookup.
- Reschedule or cancellation request flow after policy rules are defined.

### Customer Experience Priorities
- Reduce decision fatigue:
  - Present only the most relevant service/resource choices first.
- Keep time selection reassuring:
  - Show a small number of strong options before expanding into more availability.
- Preserve trust:
  - Reinforce business identity, contact information, and next-step expectations around every booking action.
- Mobile-first flow:
  - Most customer booking flows should be comfortably completable one-handed on a phone.

### Customer Page Structure
- Public booking page:
  - Brand header, short trust-building intro, service/resource chooser, availability picker, and streamlined form.
- Confirmation page:
  - Clear success state, booking summary, and follow-up expectations.
- Booking management page:
  - Lookup/auth entry, current booking state, and allowed reschedule/cancel actions.

### Customer Interaction Patterns
- Service and resource choice:
  - Default to a guided shortlist, then allow expansion into all options.
  - Clarify differences using duration, availability, or simple outcome-focused copy instead of internal business jargon.
- Availability selection:
  - Present a few recommended times first, then reveal more options by day or period.
  - Keep timezone, duration, and policy context visible near the decision point.
- Form completion:
  - Break long forms into small visual groups with progress clarity rather than one uninterrupted wall of fields.
  - Prefer inline help, masked input where useful, and confirmation-friendly review moments before final submission.
- Trust reinforcement:
  - Every step should answer what happens next, how changes can be made later, and how the business can be contacted if needed.

### Hosted Public Surfaces
- Public booking page:
  - Should feel like a polished branded booking destination rather than a generic embedded form on a blank page.
  - Use a clear hero, visible booking card/container, and optional business proof such as hours, location, or short reassurance copy.
- Embedded widget:
  - Should be compact, clear, and structurally resilient inside third-party websites.
  - The widget should favor concise labels, minimal chrome, and step clarity over full-page storytelling.

## Localization And Internationalization
- Slotwise should be planned as a locale-aware product, not an English-only UI with later translation patches.
- All customer-facing and admin-facing copy should be structured for translation, pluralization, and variable interpolation.
- Date, time, timezone, number, and phone formatting should be locale-sensitive and consistent across dashboard, booking pages, widgets, notifications, and confirmation states.
- Business-facing scheduling views must clearly show the active timezone when staff and customers may be operating across regions.

### Localization Requirements
- Text architecture:
  - Avoid hard-coded concatenated strings that become difficult to translate.
  - Prefer reusable message keys with placeholders for customer name, booking date, service name, and policy details.
- Layout resilience:
  - Components should survive longer translated labels without broken alignment, clipped buttons, or collapsed filter bars.
  - Tables, chips, tabs, and sticky action bars should allow for text expansion.
- RTL readiness:
  - Navigation, drawers, icons with directionality, step flows, and timeline affordances should be reviewed for right-to-left compatibility.
  - Directional spacing should prefer logical properties so future Arabic or Hebrew support does not require a full redesign.
- Time and calendar clarity:
  - Show timezone context near booking decisions, confirmations, reminders, and management screens.
  - Distinguish clearly between business timezone and viewer-local timezone if both are ever shown.
- Form behavior:
  - Validation, placeholders, helper text, and confirmation messages should remain understandable after translation and should not depend on English word order.
- Content governance:
  - Empty states, warnings, and policy copy should be written simply enough to translate cleanly and consistently.

## Design System
- Colors: neutral base, strong contrast, restrained accent colors, and clear status colors.
- Typography: readable UI type with compact headings for operational screens.
- Components: buttons, inputs, selects, date/time pickers, tables, badges, dialogs, tabs, empty states, loading states, error states, and success states.
- Layout: responsive desktop, tablet, and mobile patterns with stable table and form dimensions.

### Component Direction
- Buttons:
  - Primary actions should be visually decisive but not oversized.
  - Destructive actions should be explicit and require clear confirmation patterns.
- Status chips:
  - Must pair color with concise text and remain legible at small sizes.
- Tables and lists:
  - Dense, scannable, and rhythmically spaced.
  - Support sticky headers and responsive collapse strategies where needed.
- Drawers/dialogs:
  - Prefer right-side drawers for operational detail and modal dialogs for confirmations only.
- Date and time controls:
  - Should support high-frequency admin editing and simplified customer selection with minimal friction.

### Content And Copy Direction
- Tone:
  - Write like an organized host or coordinator, not a marketing funnel.
  - Prefer direct, reassuring language with short labels and low-friction instructions.
- Labels:
  - Action labels should describe the outcome clearly: `Approve booking`, `Request changes`, `Mark no-show`, `Reschedule`.
  - Avoid vague labels such as `Submit`, `Continue`, or `Manage` when a more specific verb is available.
- Empty states:
  - Empty admin states should explain whether the situation is good, expected, or caused by active filters.
  - Empty customer states should offer a clear next move, such as checking another day or contacting the business.
- Success and warning states:
  - Success should confirm the key booking facts, not just that the action completed.
  - Warning text should explain impact and recovery path whenever an action is destructive or time-sensitive.

### Dashboard And Analytics Direction
- KPI cards:
  - Pair one strong number with brief context, delta/trend, and a supporting explanation line where useful.
- Trend views:
  - Prioritize booking flow, approval lag, cancellations/no-shows, utilization, and peak periods over vanity metrics.
- Insight layout:
  - Blend metrics with operational interpretation so the dashboard feels actionable, not decorative.
- Analytics hierarchy:
  - Show urgent operational signals first, performance trends second, and exploratory breakdowns third.

### Operational UX Standards
- Loading behavior:
  - Use skeletons, progressive reveal, or optimistic continuity where helpful, but do not create fake precision while data is uncertain.
  - High-frequency admin views should preserve surrounding context during refresh instead of flashing full-screen loaders.
- Empty and zero-data states:
  - Distinguish between no data yet, no results because of filters, and data unavailable because of an error.
  - Analytics screens should still teach the product when data is sparse instead of collapsing into blank cards.
- Error handling:
  - Inline recoverable errors should stay close to the failing action.
  - Global errors should preserve the user’s work and offer the next best action rather than dead-end alerts.
- Form resilience:
  - Admin forms should support draft-like behavior for longer settings workflows.
  - Customer flows should minimize repeated entry and should protect against accidental loss during step changes.
- Trust and privacy:
  - Expose only the minimum customer data needed for the task at hand in queues, tables, and public states.
  - Sensitive data visibility should follow role and screen context, especially for contact details and notes.
- Notification and feedback patterns:
  - Toasts should be reserved for lightweight confirmation, while consequential actions should have in-context confirmation and persistent feedback.
  - The UI should differentiate between action accepted, action processing, and action fully completed.
- Performance perception:
  - Dense admin screens should feel stable under filter changes, sorting, and detail-panel transitions.
  - Public booking surfaces should prioritize fast first interaction and low-friction step advancement.

### Motion Direction
- Motion should communicate state change, not decorate:
  - panel open/close
  - filter/result refresh
  - success and warning transitions
- Avoid heavy animation in queue-heavy screens where speed matters.

## Responsive Layouts
- Desktop:
  - Use multi-column layouts, persistent filters, wide data tables, and right-side detail panels.
- Tablet:
  - Collapse secondary rails, keep timeline usable, and preserve touch-friendly controls.
- Mobile admin:
  - Prioritize queue, filters, and detail sheets over full data-table density.
- Mobile customer:
  - Treat booking as a guided step flow with sticky action areas and concise sections.
- Breakpoint behavior:
  - Navigation, timeline density, table collapse, and action placement should all be intentionally defined rather than left to browser defaults.

## Accessibility
- All status colors must include text labels.
- Form errors must appear near the relevant field.
- Keyboard navigation must cover forms, tables, filters, and dialogs.
- Touch targets must remain usable on mobile and tablet screens.
- Contrast must remain readable in all dashboard and customer portal states.

### Accessibility Requirements
- Reading order must remain logical across responsive rearrangements.
- Focus states must be highly visible in admin data-heavy contexts.
- Interactive timeline elements must be keyboard reachable and screen-reader labeled.
- Form validation must be both inline and summarized where appropriate for multi-step flows.
- Empty, loading, and error states must provide meaningful text guidance rather than color-only cues.
- Status chips, charts, and timeline markers must remain interpretable without depending on hue alone.
- Sticky mobile action areas must not hide form errors, helper text, or keyboard focus targets.

## Frontend Planning Gaps Originally Closed For Phase 14
- Screen inventory:
  - Convert the brief into a full page/screen list for owner, admin, staff, customer, widget, and public booking-page experiences.
- User flows:
  - Map the happy path, edge cases, and recovery paths for create, approve, reject, cancel, complete, no-show, reschedule, and customer self-service flows.
- Design tokens:
  - Turn the visual-language guidance into concrete token categories for color, type, spacing, radius, border, shadow, motion, and z-index behavior.
- Component inventory:
  - Define a first-class component list for filters, timeline cards, KPI cards, status chips, drawers, tables, date/time pickers, alerts, and confirmation patterns.
- State matrix:
  - Document loading, empty, partial, success, warning, and failure states per major screen.
- Localization delivery plan:
  - Decide initial supported locales, translation ownership, fallback behavior, and RTL rollout expectations.
- Data-display rules:
  - Define how names, phone numbers, dates, durations, statuses, utilization values, and conflict-risk signals should render consistently across screens.
- Role-based UX differences:
  - Clarify which navigation items, actions, and data visibility levels differ for owner, admin, staff, and customer experiences.
- Public-surface constraints:
  - Define how the widget and hosted booking page should adapt to narrow containers, external site backgrounds, and limited host control.
- Frontend-to-API contracts:
  - Confirm the minimum API payload shapes and state transitions each planned screen depends on so frontend implementation does not guess.
- Design QA:
  - Decide how responsive review, accessibility review, copy review, and regression review will be performed once implementation begins.

## Deliverable Direction For Phase 14
- Admin app should feel like an operational command center, not a generic SaaS template.
- Customer booking pages should feel branded and trustworthy without turning into a marketing site.
- Timeline and dashboard views should reuse a shared design language so analytics, queue management, and scheduling feel like one product.
- Phase 16 implementation should convert these design directions into reusable frontend components, responsive route layouts, consistent state surfaces, and API-backed screens without one-off page-specific patterns.

## Remaining Design And QA Decisions
- Exact package versions are selected for the current frontend, but future package additions or upgrades still need review.
- Authentication UI exists for operator login, invitation acceptance, password reset, customer magic-link, and protected role routes; production browser QA remains the next confidence step.
- Deployment target remains a static SPA baseline, with staging cache/fallback routing checks still needed.
- SSR or pre-rendering remains deferred unless public booking pages need SEO or materially faster unauthenticated rendering.
- Widget style isolation currently uses an iframe-first frontend foundation; richer host sizing guidance and first-party non-iframe variants remain future decisions.

## Phase 14 Selection Outcome
- The frontend implementation direction is documented in `FRONTEND_IMPLEMENTATION_ROADMAP.md`.
- The selected direction is a separate TypeScript SPA using React, Vite, React Router, and TanStack Query.
- Package installation, source scaffolding, memory-only token handling, static SPA topology, deferred SSR/pre-rendering, and iframe-first widget isolation were approved and now underpin the current `frontend/` app.
