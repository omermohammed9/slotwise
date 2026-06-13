# System Map

## Runtime Flow
```text
Client
  -> Express app (`src/app.ts`)
  -> Env helper (`src/config/env.ts`)
  -> Auth router (`src/routes/auth.routes.ts`)
     -> AuthController (`src/controllers/auth.controller.ts`)
     -> AuthService (`src/services/auth.service.ts`)
        -> OperatorAccountRepository (`src/repositories/operator-account.repository.ts`)
        -> AuthSessionRepository (`src/repositories/auth-session.repository.ts`)
        -> CustomerRepository (`src/repositories/customer.repository.ts`)
        -> VerificationTokenRepository (`src/repositories/verification-token.repository.ts`)
        -> NotificationJobRepository (`src/repositories/notification-job.repository.ts`)
        -> Argon2 auth crypto helpers (`src/utils/authCrypto.ts`)
  -> Business profile router (`src/routes/business-profile.routes.ts`)
     -> BusinessDomainValidation (`src/middleware/businessDomainValidation.ts`)
     -> BusinessProfileController (`src/controllers/business-profile.controller.ts`)
     -> BusinessProfileService (`src/services/business-profile.service.ts`)
     -> BusinessProfileRepository (`src/repositories/business-profile.repository.ts`)
     -> ServiceResourceRepository (`src/repositories/service-resource.repository.ts`) for public widget previews
     -> Mongoose BusinessProfile model (`src/models/business-profile.model.ts`)
  -> Service/resource router (`src/routes/service-resource.routes.ts`)
     -> BusinessDomainValidation (`src/middleware/businessDomainValidation.ts`)
     -> ServiceResourceController (`src/controllers/service-resource.controller.ts`)
     -> ServiceResourceService (`src/services/service-resource.service.ts`)
     -> ServiceResourceRepository (`src/repositories/service-resource.repository.ts`)
     -> Mongoose ServiceResource model (`src/models/service-resource.model.ts`)
  -> Customer router (`src/routes/customer.routes.ts`)
     -> BusinessDomainValidation (`src/middleware/businessDomainValidation.ts`)
     -> CustomerController (`src/controllers/customer.controller.ts`)
     -> CustomerService (`src/services/customer.service.ts`)
     -> CustomerRepository (`src/repositories/customer.repository.ts`)
     -> Mongoose Customer model (`src/models/customer.model.ts`)
  -> Auth persistence models
     -> Mongoose OperatorAccount model (`src/models/operator-account.model.ts`)
     -> Mongoose AuthSession model (`src/models/auth-session.model.ts`)
     -> Mongoose VerificationToken model (`src/models/verification-token.model.ts`)
  -> Notification outbox model
     -> Mongoose NotificationJob model (`src/models/notification-job.model.ts`)
  -> NotificationOutboxService (`src/services/notification-outbox.service.ts`)
     -> Notification templates (`src/utils/notificationTemplates.ts`)
     -> Email provider adapter (`Resend` or `noop`)
  -> Booking router (`src/routes/booking.routes.ts`)
     -> Role middleware (`src/middleware/requireRole.ts`) for privileged status actions
     -> Booking request validation (`src/middleware/bookingRequestValidation.ts`)
  -> BookingController (`src/controllers/booking.controller.ts`)
  -> BookingService (`src/services/booking.service.ts`)
     -> Hunter API (`src/utils/emailVerifier.ts`)
     -> BookingRepository (`src/repositories/booking.repository.ts`)
     -> BusinessProfileRepository (`src/repositories/business-profile.repository.ts`)
     -> ServiceResourceRepository (`src/repositories/service-resource.repository.ts`)
     -> CustomerRepository (`src/repositories/customer.repository.ts`)
        -> Mongoose Booking model (`src/models/booking.model.ts`)
        -> MongoDB

Tests
  -> Node built-in test runner (`node --test`)
  -> Compiled runtime output in `dist/`
  -> Validator, controller, and service verification

Maintenance
  -> `.gitignore` excludes generated output, dependencies, IDE files, and secrets
  -> `.editorconfig` defines shared editor defaults
```

## Planned Slotwise Architecture
```text
Client / Future Frontend
  -> `frontend/` React + Vite SPA
  -> React Router routing foundation
  -> TanStack Query server-state layer foundation
  -> API envelope client (`frontend/src/api/client.ts`)
  -> Memory-only session store (`frontend/src/auth/sessionStore.ts`)
  -> Express routes
  -> Thin controllers
  -> Services for business rules
  -> Repositories for persistence
  -> Mongoose models
  -> MongoDB
```

## Entry Points
- HTTP server: `src/app.ts`
- Environment helper: `src/config/env.ts`
- Auth API base path: `/auth`
- Business profile API base path: `/businesses`
- Booking API base path: `/bookings`
- Customer API base path: `/customers`
- Service/resource API base path: `/service-resources`
- Role middleware: `src/middleware/requireRole.ts`
- Booking request validation: `src/middleware/bookingRequestValidation.ts`
- Business domain validation: `src/middleware/businessDomainValidation.ts`
- Auth service: `src/services/auth.service.ts`
- Operator account repository: `src/repositories/operator-account.repository.ts`
- Auth session repository: `src/repositories/auth-session.repository.ts`
- Verification token repository: `src/repositories/verification-token.repository.ts`
- Notification job repository: `src/repositories/notification-job.repository.ts`
- Database connection: `src/config/db.ts`
- Booking repository: `src/repositories/booking.repository.ts`
- Business profile repository: `src/repositories/business-profile.repository.ts`
- Service/resource repository: `src/repositories/service-resource.repository.ts`
- Customer repository: `src/repositories/customer.repository.ts`
- Business profile model: `src/models/business-profile.model.ts`
- Service/resource model: `src/models/service-resource.model.ts`
- Customer model: `src/models/customer.model.ts`
- Operator account model: `src/models/operator-account.model.ts`
- Auth session model: `src/models/auth-session.model.ts`
- Verification token model: `src/models/verification-token.model.ts`
- Notification job model: `src/models/notification-job.model.ts`
- Notification outbox service: `src/services/notification-outbox.service.ts`
- Auth crypto helpers: `src/utils/authCrypto.ts`
- Notification template renderer: `src/utils/notificationTemplates.ts`
- Test entry points: `tests/validators.test.js`, `tests/bookingService.test.js`, `tests/bookingController.test.js`
- Route test entry point: `tests/bookingRoutes.test.js`
- Frontend app entry point: `frontend/src/main.tsx`
- Frontend dashboard shell: `frontend/src/app/App.tsx`
- Frontend route map: `frontend/src/app/routeMap.tsx`
- Frontend app shell layout: `frontend/src/app/AppShell.tsx`
- Frontend dashboard page: `frontend/src/features/admin/DashboardPage.tsx`
- Frontend API client foundation: `frontend/src/api/client.ts`
- Frontend session store: `frontend/src/auth/sessionStore.ts`

## Routes
- Auth routes:
  - `POST /auth/session`
  - `POST /auth/customer/magic-link`
  - `POST /auth/customer/verify`
  - `GET /auth/session`
  - `DELETE /auth/session`
- Preferred REST aliases:
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
  - `GET /bookings/insights/cancellation-no-show`
  - `POST /bookings/suggestions`
  - `PATCH /bookings/:id`
  - `PUT /bookings/:id`
  - `DELETE /bookings/:id`
- Business profile routes:
  - `POST /businesses`
  - `GET /businesses`
  - `GET /businesses/public/:slug/booking-page`
  - `GET /businesses/public/:slug/widget`
  - `GET /businesses/:id`
  - `PATCH /businesses/:id`
- Customer routes:
  - `POST /customers`
  - `GET /customers`
  - `GET /customers/:id`
  - `PATCH /customers/:id`
- Service/resource routes:
  - `POST /service-resources`
  - `GET /service-resources`
  - `GET /service-resources/:id`
  - `PATCH /service-resources/:id`
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

## External Dependencies
- MongoDB via `MONGODB_URI`
- Hunter email verifier via `HUNTER_API_KEY`
- Operator auth credentials via `SLOTWISE_OWNER_*`, `SLOTWISE_ADMIN_*`, `SLOTWISE_STAFF_*`, and `SLOTWISE_SESSION_TTL_MINUTES`
- Optional MongoDB SRV DNS override via `SLOTWISE_DNS_SERVERS`

## Package Maintenance Surface
- Runtime packages: `axios`, `dotenv`, `express`, `libphonenumber-js`, `mongoose`, `validator`.
- Development packages: `@types/express`, `@types/validator`, `nodemon`, `ts-node`.
- Phase 15 was executed through the bundled npm CLI fallback because the normal `npm` shim is broken on this machine.
- Current direct version targets declared in `package.json`: `axios@^1.17.0`, `dotenv@^17.4.2`, `express@^5.2.1`, `libphonenumber-js@^1.13.6`, `mongoose@^9.7.0`, `validator@^13.15.35`, `@types/express@^5.0.6`, `@types/validator@^13.15.10`, `nodemon@^3.1.14`, `ts-node@^10.9.2`.
- The initial audit reported 17 vulnerabilities, and the final audit result is now 0 vulnerabilities.
- Deprecated `@types/mongoose` has been removed.
- `dotenv` was upgraded to `17.4.2` with an explicit quiet-mode workaround in `src/config/env.ts`.
- `express` was upgraded to `5.2.1` with `@types/express` `5.0.6`.
- `mongoose` was upgraded to `9.7.0`, with small type-compatibility adjustments in `src/interfaces/booking.interface.ts` and `src/utils/validators.ts`.
- Remaining package-health issues are machine-level toolchain concerns rather than repository dependency gaps: Node `v23.6.0` is on an EOL line, normal npm now works at `11.16.0` outside the sandbox, and the Node 24 LTS installer is blocked by an administrator-only uninstall/upgrade step.
- Candidate future packages must be justified before adoption and documented here after approval.

## Instruction Sources
Codex-specific governance should live in `.codex/`. If `.agents/` exists, treat it as legacy or secondary unless the user explicitly says otherwise.
- Active Codex governance files now include `.codex/project-governor.md`, `.codex/rough-request.prompt.md`, `.codex/instructions.md`, `.codex/rules/code-standards.md`, and `.codex/rules/strict-resource-management.md`.

## Planned System Changes
- Product identity is now Slotwise.
- Package identity is now `slotwise-api`.
- Repository folder is planned to be renamed from `Booking System` to `Slotwise`.
- The root folder rename remains an external/manual workspace action because this Codex session is bound to the current `Booking System` path.
- Source file/folder naming now uses professional dot-case conventions for booking routes, controller, service, model, and interface files.
- A booking repository layer now isolates Mongoose access from booking service business rules.
- Configuration now prefers root `.env` and temporarily falls back to `src/.env`.
- Required env vars are validated before MongoDB and Hunter API usage.
- Booking update flow verifies email only when email is being changed.
- Booking availability checks now use date and time overlap through the repository layer.
- Booking get/update/delete flows return `404` when the target booking is missing.
- Booking delete returns an empty `204` when deletion succeeds.
- Booking approval/rejection routes are now available behind owner/admin bearer sessions.
- Booking cancellation/completion routes are now available behind the same owner/admin bearer-session boundary.
- Booking list reads now support repository-backed filtering, pagination, and sorting through `GET /bookings` query parameters.
- Booking list text filters now target normalized searchable fields with supporting indexes.
- Booking suggestions are now exposed through `POST /bookings/suggestions` and reuse the booking service availability rules to generate ranked nearby alternatives.
- Booking conflict-risk snapshots are now persisted in booking documents and can be filtered through booking-list queries by `conflictRiskLevel`.
- Booking timeline data is now exposed through `GET /bookings/timeline`, grouped by day with sorted booking entries and per-day summary counts.
- Booking dashboard analytics are now exposed through `GET /bookings/insights/dashboard`, with KPI summaries, lifecycle funnel counts, utilization slices, and peak booking-hour aggregates.
- Booking lifecycle analytics are now exposed through `GET /bookings/insights/cancellation-no-show`, backed by persisted booking status history and the explicit `no_show` lifecycle state.
- Business template presets are now exposed through `GET /businesses/templates` and can be applied during business-profile create/update through `templateKey`.
- Business profiles can now persist widget settings, and public widget bootstrap data is exposed through `GET /businesses/public/:slug/widget` for active businesses by slug.
- Business profiles can now persist public booking-page settings, and hosted booking-page bootstrap data is exposed through `GET /businesses/public/:slug/booking-page` for active businesses by slug.
- Booking routes now validate create/update payloads, list query parameters, and booking ids before controller handling.
- Controllers and middleware now use shared API response helpers for consistent JSON success and error envelopes.
- Booking status changes now append `statusHistory` entries through the repository layer, including role, optional actor id, optional reason, and timestamp.
- Booking service responses now derive `conflictRisk` metadata from existing booking fields so operators can review urgency and coordination risk without a separate analytics store.
- Booking create/update flows can now scope availability by business and service/resource, create or reuse customer records, attach notification plans, and append reschedule history metadata.
- Staff operators can now access staff-scoped management and booking lifecycle flows through the same bearer-session auth surface.
- Persistent-auth and notification-outbox models now exist, but runtime auth and delivery services are still being migrated onto them.
- Operator authentication is now backed by persistent operator accounts, Argon2 password verification, and hashed opaque sessions stored in MongoDB.
- Customer authentication is now backed by persisted verification tokens and customer sessions rather than booking-id-plus-email self-service bodies.
- Notification delivery is now backed by an outbox worker that processes queued transactional emails through the configured provider.
- Booking metadata backfill is now an explicit script at `src/scripts/backfill-booking-metadata.ts`.
- Booking documents no longer define a password field; schema serialization strips legacy `password` values if present.
- Phone validation now returns explicit booleans for valid and invalid input.
- Full identity/session authentication remains future hardening beyond the current trusted role-header boundary.
- Lint/format tooling and CI remain deferred until npm and repository hosting are in a healthier state.
- Mandatory platform features are planned: full date-time availability, booking lifecycle expansion, admin flows, filtering, pagination, audit trail, request validation, and standard responses.
- Professional business features are planned: business profiles, service/resources, working hours, customer records, notifications, rescheduling, and roles.
- Shared Phase 11 business-domain models now exist for business profiles, service/resources, and customers; route and service wiring is still in progress.
- Frontend planning is now split into a UI/UX design brief first, followed by a deferred implementation roadmap for admin and customer portals.
- The UI/UX brief now defines the planned frontend brand posture, admin information architecture, customer flow structure, responsive behavior, design-system direction, accessibility guardrails, screen composition, interaction patterns, localization expectations, operational UX standards, and explicit frontend planning gaps for later Phase 14 implementation.
- `FRONTEND_IMPLEMENTATION_ROADMAP.md` now selects the planned frontend direction: a future separate React + Vite TypeScript SPA using React Router and TanStack Query, with Slotwise-specific admin, customer, public booking-page, and widget components.
- The first `frontend/` scaffold is now in place with a Vite + React + TypeScript admin dashboard shell, package lockfile, test setup, and isolated frontend dependency tree.
- Dependency modernization is planned as Phase 15, including npm repair, vulnerability fixes, package updates, obsolete package removal, and carefully justified modern package additions.
- Phase 16 now owns frontend/backend feature alignment, including route coverage, API DTO modules, admin/operator screens, customer portal, public booking page, and iframe-first widget UI foundation.
- Phase 16.2 added route coverage for `/admin`, `/admin/bookings`, `/admin/timeline`, `/admin/customers`, `/admin/resources`, `/admin/settings`, `/portal`, `/book/:slug`, and `/widget/:slug` without changing backend APIs or auth behavior.
