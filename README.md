# Slotwise

Slotwise is a TypeScript/Node.js booking API built with Express and MongoDB (Mongoose). The project is being evolved from a basic booking API into a flexible booking platform for businesses that need reservations, appointments, services, spaces, resources, or event scheduling.

Package identity: `slotwise-api`.

Current workspace folder: `Booking System`. Target workspace folder: `Slotwise`; rename it outside this active Codex session after tools are no longer bound to the current path.

## Current Status

- Configuration hygiene is in place with `.env.example` and centralized env loading.
- Core CRUD booking flows are implemented.
- Booking passwords were removed from the domain model.
- Automated tests cover validators, selected service behavior, and controller responses.
- Booking persistence now flows through a repository boundary instead of direct service-to-Mongoose coupling.
- Privileged booking status actions now use operator login plus bearer session authentication.
- Embeddable booking widget foundations now exist through persisted business `widgetSettings` and a public widget-config endpoint.
- Public booking-page customization foundations now exist through persisted business `publicPageSettings` and a public booking-page config endpoint.
- Frontend/UI planning now has a fuller design brief covering brand direction, admin/customer experience structure, responsive behavior, and accessibility expectations.
- The design brief now also defines visual language, screen composition, interaction patterns, hosted-surface behavior, analytics presentation, and copy tone for the future frontend.
- The design brief now also includes localization and internationalization guidance for translated copy, locale-aware formatting, timezone clarity, and RTL readiness.
- The design brief now also includes operational UX standards and an explicit frontend gap checklist for screens, states, components, role differences, public surfaces, API dependencies, and design QA.
- The frontend implementation roadmap now selects a future React + Vite + React Router + TanStack Query direction and lists the needed screens, components, API contracts, state rules, and verification expectations before implementation begins.
- The frontend roadmap records the approved architecture/package adoption plan that led to the current `frontend/` scaffold, with token/session storage, deployment, SSR/pre-rendering, and widget style isolation still treated as explicit decision checkpoints for future expansion.
- The Phase 14 pre-scaffold decisions are approved for planning: memory-only token storage for the first slice, static SPA deployment, deferred SSR/pre-rendering, and iframe isolation for third-party widget embeds.
- The first isolated frontend scaffold now exists under `frontend/` with Vite, React, TypeScript, TanStack Query, Tailwind CSS, an admin dashboard shell, API/session foundations, and smoke tests.
- Phase 16 is now the active frontend/backend alignment phase. Its coverage matrix, route-map slice, shared API DTO/client slice, operator auth screen slice, query-backed bookings list, booking detail drawer, role-aware lifecycle actions, operator reschedule/suggestion flows, timeline view, dashboard analytics, cancellation/no-show insights, customer management create/edit flows, business settings with template preview plus working-hours/blackout editors, resource screens with edit drawers and availability override editing, public booking page flow, customer portal flow, embeddable widget flow, shared admin states, responsive/accessibility QA pass, and the approved 16.25 session-revalidation hardening slice are complete.
- The active roadmap now plans Repository Pattern, platform features, and future admin/customer UI/UX.

## Requirements

- Node.js
- MongoDB connection string
- Hunter API key for email verification

## Configuration

Create a root `.env` file using the values documented in [`.env.example`](</C:/Users/omarz/Desktop/Booking System/.env.example>).

Required environment variables:

- `PORT`
- `MONGODB_URI`
- `HUNTER_API_KEY`
- `SLOTWISE_OWNER_USERNAME`
- `SLOTWISE_OWNER_PASSWORD`
- `SLOTWISE_ADMIN_USERNAME`
- `SLOTWISE_ADMIN_PASSWORD`
- `SLOTWISE_STAFF_USERNAME` optional
- `SLOTWISE_STAFF_PASSWORD` optional
- `SLOTWISE_AUTH_PEPPER` optional but recommended for password hashing
- `SLOTWISE_MAGIC_LINK_TTL_MINUTES` optional
- `SLOTWISE_EMAIL_PROVIDER` optional: `resend` or `noop`
- `SLOTWISE_EMAIL_FROM` required when `SLOTWISE_EMAIL_PROVIDER=resend`
- `RESEND_API_KEY` required when `SLOTWISE_EMAIL_PROVIDER=resend`
- `SLOTWISE_CUSTOMER_MAGIC_LINK_BASE_URL` optional
- `SLOTWISE_NOTIFICATION_WORKER_ENABLED` optional
- `SLOTWISE_NOTIFICATION_WORKER_INTERVAL_MS` optional
- `SLOTWISE_NOTIFICATION_WORKER_BATCH_SIZE` optional
- `SLOTWISE_DNS_SERVERS` optional for MongoDB SRV DNS override when local resolvers refuse Atlas SRV lookups

The app still falls back to `src/.env` for backward compatibility, but root `.env` is the preferred layout.

## Commands

- `npm run dev` starts the development server
- `npm run build` compiles TypeScript
- `npm test` runs the test suite
- `npm run backfill:bookings` backfills legacy booking search fields and status history

Frontend commands from `frontend/`:

- `npm run dev -- --host 127.0.0.1 --port 5173` starts the Vite frontend server
- `npm run build` builds the frontend
- `npm run test:run` runs frontend tests
- `npm audit --audit-level=moderate` audits the frontend dependency tree

If bare `npm` is broken in the Codex PowerShell/sandbox path, use:

- `C:\Program Files\nodejs\npm.cmd`
- `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"`
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

## Maintenance Policy

- `node_modules/` is a local dependency cache and should not be tracked as source.
- `dist/` is generated build output and should be reproducible from source.
- Root `.env` and legacy `src/.env` are runtime secrets and should not be committed.
- Preferred verification flow is compile first, then run tests.
- Backend layering now expects routes to compose controllers, controllers to handle HTTP mapping, services to own business rules, repositories to own persistence queries, and models to define database shape.
- Lint and formatting tool selection is still deferred because there is no agreed repository/CI baseline yet, even though normal unsandboxed npm now works again on this machine.
- CI setup is also deferred until the project is attached to a real Git remote/provider; the remaining npm issue is sandbox-specific rather than a general machine blocker.
- Dependency modernization is tracked in Phase 15: audit, safe fixes, outdated-package review, compatible updates, major upgrades with migration notes, and justified package adoption only when a real backend need exists.
- Normal unsandboxed npm works on this machine and was re-verified at `11.16.0` on June 16, 2026 with `npm run build` and `npm test`.
- The remaining npm issue is Codex PowerShell/sandbox-specific: `C:\Program Files\nodejs\npm.ps1` selects `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`, which the sandbox cannot read/execute. Use `C:\Program Files\nodejs\npm.cmd` or the bundled CLI path inside Codex.
- Phase 15 dependency modernization is complete for the repository: audit vulnerabilities are 0, `form-data` was repaired to `4.0.6` through approved non-force `npm audit fix`, deprecated `@types/mongoose` was removed, `dotenv` was upgraded to `17.4.2`, `express` was upgraded to `5.2.1`, and `mongoose` was upgraded to `9.7.0`.
- Current machine Node is `v26.3.0` as of June 16, 2026. Official Node metadata lists `v24.16.0` as Latest LTS, `v26.3.0` as Current/Latest Release, and the v23 line as EOL; moving this machine to LTS remains an administrator-level installer/uninstall task based on the prior Windows Installer `1730` blocker.
- New packages should be introduced only when they are required for security, validation, logging, testing, API documentation, configuration safety, or future frontend implementation.

## API Base Path

All routes are mounted under `/bookings`.

Authentication routes are mounted under `/auth`.

Business management routes are mounted under `/businesses`, `/service-resources`, and `/customers`.

## Auth Routes

- `POST /auth/session`
- `POST /auth/customer/magic-link`
- `POST /auth/customer/verify`
- `GET /auth/session`
- `DELETE /auth/session`

## Preferred REST Routes

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id/approve`
- `PATCH /bookings/:id/reject`
- `PATCH /bookings/:id/cancel`
- `PATCH /bookings/:id/complete`
- `PATCH /bookings/:id/no-show`
- `PATCH /bookings/:id/reschedule`
- `POST /bookings/:id/customer-cancel`
- `POST /bookings/:id/customer-reschedule`
- `GET /bookings/timeline`
- `GET /bookings/insights/dashboard`
- `POST /bookings/suggestions`
- `GET /bookings/insights/cancellation-no-show`
- `PATCH /bookings/:id`
- `PUT /bookings/:id`
- `DELETE /bookings/:id`

## Phase 11 Management Routes

- `POST /businesses`
- `GET /businesses`
- `GET /businesses/templates`
- `GET /businesses/templates/:templateKey`
- `GET /businesses/public/:slug/booking-page`
- `GET /businesses/public/:slug/widget`
- `GET /businesses/:id`
- `PATCH /businesses/:id`
- `POST /service-resources`
- `GET /service-resources`
- `GET /service-resources/:id`
- `PATCH /service-resources/:id`
- `POST /customers`
- `GET /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`

## Legacy Routes Still Supported

- `POST /bookings/createbookings`
- `GET /bookings/all`
- `GET /bookings/get/:id`
- `PUT /bookings/update/:id`
- `PATCH /bookings/approve/:id`
- `PATCH /bookings/reject/:id`
- `PATCH /bookings/cancel/:id`
- `PATCH /bookings/complete/:id`
- `PATCH /bookings/no-show/:id`
- `PATCH /bookings/reschedule/:id`
- `POST /bookings/customer-cancel/:id`
- `POST /bookings/customer-reschedule/:id`
- `DELETE /bookings/delete/:id`

## Example Create Request

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "fName": "Jane",
  "lName": "Doe",
  "gender": "female",
  "email": "jane@example.com",
  "phone": "+14155552671",
  "startDate": "2030-01-02T00:00:00.000Z",
  "endDate": "2030-01-03T00:00:00.000Z",
  "timein": "2030-01-02T09:00:00.000Z",
  "timeout": "2030-01-03T10:00:00.000Z",
  "status": "pending"
}
```

## Example Partial Update Request

```json
{
  "phone": "+14155552672",
  "partySize": 3,
  "notes": "Window seating if available"
}
```

## Response Notes

- Missing bookings return `404`.
- Successful delete returns `204` with no response body.
- Successful JSON responses return `{ "success": true, "data": ... }`, with `meta` included for list pagination and sorting.
- Error JSON responses return `{ "success": false, "error": { "message": "..." } }`.
- Booking responses now include derived `conflictRisk` metadata with `level`, `score`, `summary`, `evaluatedAt`, and `signals` fields to help staff review operational risk before approval.
- Booking mutations now persist a `conflictRisk` snapshot, and `GET /bookings` supports `conflictRiskLevel=low|medium|high` filtering.
- `GET /bookings/timeline` returns day-grouped booking entries with sorted time slots, duration minutes, reschedule flags, conflict-risk context, and per-day summary counts.
- `GET /bookings/insights/dashboard` returns dashboard-ready KPI summaries, lifecycle funnel counts, utilization minutes, average party size, peak booking times, and per-resource utilization slices.
- `POST /bookings/suggestions` accepts scheduling inputs and returns ranked nearby alternatives with per-suggestion score, summary, timing, and conflict-risk preview.
- `GET /bookings/insights/cancellation-no-show` returns cancellation/no-show rates, top reasons, and weekday trend counts for the selected scope.
- Email verification runs on create and when `email` is explicitly updated.
- Privileged status-action routes require an operator bearer session from `POST /auth/session`.
- Operator sessions are bootstrapped from env-backed owner/admin/staff credentials into persistent operator accounts and expire based on `SLOTWISE_SESSION_TTL_MINUTES`.
- Status-action routes may include optional body `reason` values for audit history.
- Booking status lifecycle supports `pending`, `approved`, `rejected`, `cancelled`, `completed`, and `no_show`.
- Status changes append `statusHistory` entries with previous status, next status, timestamp, role, optional actor id, and optional reason.
- Staff operators can mark approved bookings as `no_show` through the dedicated no-show endpoint.
- Current conflict-risk signals are `starts_soon`, `approval_stale`, `repeat_reschedule`, `large_party`, `tight_turnaround`, and `heavy_day_load`.
- Create/update booking payloads may also include optional `businessId`, `customerId`, `serviceResourceId`, `partySize`, and `notes`.
- `GET /bookings` supports `status`, `startDateFrom`, `startDateTo`, `businessId`, `customerId`, `serviceResourceId`, `email`, `phone`, `customerName`, `page`, `limit`, `sortBy`, and `sortOrder` query parameters.
- `GET /bookings` also supports `conflictRiskLevel` for server-side filtering of persisted risk snapshots.
- `GET /bookings/insights/cancellation-no-show` supports `startDateFrom`, `startDateTo`, `businessId`, and `serviceResourceId` query parameters.
- `GET /bookings/insights/dashboard` supports `startDateFrom`, `startDateTo`, `businessId`, and `serviceResourceId` query parameters.
- List sorting supports `createdAt`, `updatedAt`, `startDate`, `endDate`, and `status`; `limit` is capped at `100`.
- Text filters now use normalized indexed fields and behave as anchored prefix matches for email, phone, and customer name.
- Generic update routes reject direct `status` changes; use the status-action endpoints for lifecycle changes.
- Create, update, list, and id-based routes validate request shape before controller logic runs.
- Legacy metadata backfill is now an explicit maintenance command instead of a lazy runtime migration.
- Business-scoped bookings now enforce configured advance notice, slot interval, blackout windows, working hours, resource capacity, and scoped overlap checks when related business data is present.
- Business-scoped bookings now seed notification planning metadata and can retain reschedule history.
- Staff operators can manage service/resources, customer records, booking cancellation/completion, and booking rescheduling through bearer-session routes.
- Customer self-service cancellation and rescheduling now require a persistent customer session created through the magic-link auth flow.
- Notification jobs can now be delivered through a provider-backed outbox worker; `noop` remains available as a safe local fallback when provider credentials are not configured.
- Business-profile create/update payloads may include optional `templateKey` values to apply preset defaults for restaurant, clinic, salon, consulting, venue, rental, and fitness workflows.
- Business-profile create/update payloads may also include optional `widgetSettings` overrides for public widget branding, copy, and field visibility.
- Business-profile create/update payloads may also include optional `publicPageSettings` overrides for hosted public booking-page copy, visibility toggles, and media URLs.
- Business template presets currently provide availability rules, working hours, notification defaults, widget defaults, public-page defaults, and suggested resource blueprints.
- `GET /businesses/public/:slug/booking-page` returns public booking-page configuration for active businesses, including page settings, optional widget branding, optional contact details, optional working hours, active resource previews, and booking endpoint hints.
- `GET /businesses/public/:slug/widget` returns public widget configuration for active businesses, including widget settings, optional description, active resource previews, and booking endpoint hints.

## Known Gaps

- Existing database records may still contain historical `password` fields and need a separate cleanup/migration decision.
- The explicit booking metadata backfill command could not be executed from this machine because the current `MONGODB_URI` host does not exist in public DNS.
- SMS delivery remains modeled but does not yet have a concrete provider implementation; email delivery is the supported live channel.
- Frontend/admin visualization for these insights remains deferred until the UI phase begins.
- The hosted public booking page now has a dedicated `/book/:slug` frontend flow backed by existing public config, suggestion, and booking creation APIs.
- The embeddable widget now has a dedicated `/widget/:slug` frontend flow backed by the existing public widget config, booking suggestion, and booking creation APIs.
- Automatic service/resource creation from business template blueprints is still deferred; template discovery is available now, but seeding remains a later task.
- Source folders/files now use professional dot-case naming for booking routes, controller, service, model, and interface files.
- Frontend implementation is active under Phase 16 and remains governed by the UI/UX brief, auth model, and API roadmap.
- The current frontend planning source of truth is `UI_UX_DESIGN_BRIEF.md`.
- The current frontend implementation planning source of truth is `FRONTEND_IMPLEMENTATION_ROADMAP.md`.
- The approved Phase 16.22 `/admin/bookings` URL-state slice is now complete, so customer search, status/risk filters, sorting, and pagination survive reloads and share clean search-param links without backend changes.
- The approved Phase 16.23 `/admin/bookings` saved-view slice is now complete, so the existing customer/status/risk/sort/page workspace state can be saved, reapplied, and removed from browser-local storage on the current device.
- The approved Phase 16.24 `/admin/bookings` active-filter-chip slice is now complete, so the existing customer/status/risk/sort/page workspace state also surfaces lightweight removable chips plus a clear-all reset back to the default clean URL.
- The approved Phase 16.25 session-hardening slice is now complete, so real operator and customer sessions revalidate against the backend on entry and tab return, refresh current-session metadata in memory, and fail closed with clear expiry messaging while keeping token storage memory-only.
- The approved grouped admin-management slice is now complete through Phase 16.28, so `/admin/settings` now edits working hours and blackout dates, `/admin/resources` now supports edit drawers plus availability override editing, and `/admin/customers` now supports create/edit flows over existing backend APIs; explicit clearing of already persisted nested resource override keys still needs backend contract support.
- The current frontend implementation phase is Phase 16; route-map/app-shell routing, shared API DTO/client modules, operator auth/memory-session flow, current-session revalidation for real operator/customer sessions, the query-backed `/admin/bookings` list with URL-persistent list state, browser-local saved views, and removable active-filter chips, the booking detail drawer, role-aware lifecycle actions, operator reschedule/suggestion flows, the query-backed `/admin/timeline` view, dashboard analytics, cancellation/no-show insights, customer management create/edit coverage, business settings with read-only template preview plus working-hours/blackout editors, resource management with edit drawers and availability override editing, the public `/book/:slug` booking flow, the customer `/portal` magic-link and booking-management flow, the compact `/widget/:slug` embed flow, shared admin states, the responsive/accessibility QA pass, and the approved 16.21 public-surface hardening pass are complete.
- Browser visual QA for the first scaffold still needs to run once the in-app browser runtime is available in this Windows sandbox.
- The remaining repository-folder rename is tracked in the implementation plan and should be handled only after workspace path risk is accepted.

## Roadmap

- Business profiles, services/resources, configurable availability, customers, notifications, rescheduling, and role model.
- later public/customer/widget hardening slices after separate approval.
- Dependency audit, vulnerability fixes, package updates, and justified modern package adoption.
