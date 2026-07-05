# Project Context

## Snapshot
- Project: Slotwise
- Package: `slotwise-api`
- Current repository folder: `Slotwise`
- Type: TypeScript/Node.js backend API
- Runtime: Node.js
- Framework: Express
- Database: MongoDB through Mongoose
- External integration: Hunter email verifier API
- Product direction: flexible booking platform for reservations, appointments, services, spaces, resources, and event scheduling.

## Current Structure
- `src/app.ts` creates the Express app with CORS, request observability, JSON parsing, HTTPS enforcement, CSRF protection, health/readiness routes, auth, audit, business, booking, customer, and service-resource routes. It starts the API after MongoDB connects.
- `src/worker.ts` is the dedicated notification outbox worker entrypoint. API startup does not start notification processing.
- `src/config/env.ts` loads environment variables from root `.env`, falls back to `src/.env` for backward compatibility, exposes required env validation, runtime environment helpers, cookie/CORS/proxy helpers, and the port fallback.
- `src/config/db.ts` validates `MONGODB_URI` and connects Mongoose.
- `src/routes/booking.routes.ts` defines booking CRUD HTTP routes and exposes both preferred REST aliases and legacy compatibility routes.
- `src/routes/auth.routes.ts` defines operator session login, operator listing, operator invitations, invitation acceptance, password reset, role/status administration, customer magic-link request/verify flows, current-session lookup, and logout routes.
- `src/routes/audit-log.routes.ts` exposes owner/admin audit-log reads.
- `src/routes/health.routes.ts` exposes liveness and readiness checks.
- `src/routes/business-profile.routes.ts`, `src/routes/service-resource.routes.ts`, and `src/routes/customer.routes.ts` expose Phase 11 management APIs.
- `src/controllers/booking.controller.ts` translates HTTP requests into service calls.
- `src/controllers/auth.controller.ts` handles operator session creation and revocation.
- `src/controllers/business-profile.controller.ts`, `src/controllers/service-resource.controller.ts`, and `src/controllers/customer.controller.ts` map Phase 11 business-domain HTTP flows.
- `src/services/booking.service.ts` contains booking creation, availability, email verification, and CRUD logic.
- `src/services/auth.service.ts` manages Argon2-verified operator login, local/test-only bootstrap seeding, operator invitations, password resets, role/status administration, customer magic-link verification, and MongoDB-backed hashed opaque sessions.
- `src/services/audit-log.service.ts` records and lists audit events.
- `src/services/notification-outbox.service.ts` now processes queued notification jobs through provider-backed delivery with retries and worker lifecycle controls.
- `src/services/business-profile.service.ts`, `src/services/service-resource.service.ts`, and `src/services/customer.service.ts` own the new business-domain management logic.
- `src/repositories/booking.repository.ts` owns booking persistence queries and Mongoose model access.
- `src/repositories/business-profile.repository.ts`, `src/repositories/service-resource.repository.ts`, and `src/repositories/customer.repository.ts` now own the first Phase 11 business-domain persistence queries.
- `src/repositories/audit-log.repository.ts` owns audit-log persistence queries.
- `src/middleware/requireRole.ts` enforces authenticated sessions and role checks.
- `src/middleware/businessAuthorization.ts` enforces business-scoped authorization for non-owner operators.
- `src/middleware/csrf.ts` enforces CSRF cookie/header agreement for unsafe cookie-authenticated requests.
- `src/middleware/cors.ts` applies configured CORS allow-list behavior.
- `src/middleware/rateLimit.ts` provides in-process rate limiting for sensitive auth routes.
- `src/middleware/requestObservability.ts` assigns request IDs, logs requests, and centralizes safe not-found/error responses.
- `src/models/booking.model.ts` defines the Mongoose booking schema.
- `src/models/business-profile.model.ts` defines business profile settings, working hours, blackout dates, notification settings, and business-member role assignments.
- `src/models/service-resource.model.ts` defines bookable services/resources such as staff, rooms, tables, equipment, appointments, and events.
- `src/models/customer.model.ts` defines reusable customer records scoped to a business.
- `src/models/operator-account.model.ts` defines persistent operator accounts for owner/admin/staff authentication.
- `src/models/auth-session.model.ts` defines persistent sessions with TTL expiry and revocation support.
- `src/models/verification-token.model.ts` defines short-lived customer authentication tokens.
- `src/models/notification-job.model.ts` defines notification outbox jobs for delivery processing.
- `src/models/audit-log.model.ts` defines audit-log records.
- `src/models/migration-state.model.ts` records applied migrations.
- `src/interfaces/booking.interface.ts` defines the booking document type.
- `src/interfaces/business.interface.ts`, `src/interfaces/service-resource.interface.ts`, and `src/interfaces/customer.interface.ts` define the Phase 11 business-domain contracts.
- `src/interfaces/operator-account.interface.ts`, `src/interfaces/auth-session.interface.ts`, `src/interfaces/verification-token.interface.ts`, and `src/interfaces/notification-job.interface.ts` define the post-Phase 11 auth/notification persistence contracts.
- `src/utils/validators.ts` contains field validators.
- `src/utils/emailVerifier.ts` calls Hunter's email verification API.
- `src/middleware/businessDomainValidation.ts` validates business-profile, service-resource, and customer management requests.
- `src/utils/authCrypto.ts` centralizes Argon2 password hashing plus opaque token/session id helpers.
- `src/utils/sessionCookie.ts` centralizes session/CSRF cookie parsing and setting.
- `src/utils/logger.ts` emits structured JSON logs.
- `src/utils/notificationTemplates.ts` renders transactional notification content for auth and booking flows.
- `src/scripts/run-migrations.ts` runs the migration registry in status, dry-run, or apply mode.
- `src/scripts/setup-first-owner.ts` creates the first production owner through a controlled one-time setup path.
- `tests/*.test.js` contains Node built-in tests for validators, service logic, and controller behavior against compiled output.
- `README.md` documents setup, routes, examples, and known gaps.
- `UI_UX_DESIGN_BRIEF.md` now acts as the active Phase 13 frontend planning artifact.
- `FRONTEND_IMPLEMENTATION_ROADMAP.md` now acts as the active Phase 14 frontend implementation planning and selection artifact.
- `frontend/` now contains the first isolated Vite + React + TypeScript frontend scaffold for Slotwise.
- `frontend/` now uses the `@/` source alias for imports from `frontend/src`, configured in the frontend TypeScript and Vite configs.
- `frontend/src/app/routeMap.tsx` now defines role-aware owner/admin/staff route families plus public/customer routes.
- `frontend/src/auth/ForbiddenPage.tsx` provides the blocked-route state.
- `frontend/src/features/admin/UserAdminPage.tsx` provides the owner-facing operator administration surface.
- `frontend/src/features/admin/AuditLogPage.tsx` provides the owner/admin audit-log surface.
- `.gitignore` and `.editorconfig` now define basic repository hygiene and editor defaults.

## Governance And Instructions
Before coding, inspect project governance files when present:
- `.codex/project-governor.md`
- `.codex/rough-request.prompt.md`
- `.codex/instructions.md`
- `.codex/rules/AGENTS.md`
- `.codex/rules/code-standards.md`
- `.codex/rules/strict-resource-management.md`
- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`
- `IMPLEMENTATION_PLAN.md`

Legacy `.agents/*` files may be inspected if they exist, but `.codex/*` is the preferred directory for Codex-specific instructions.

Current Codex governance status:
- `.codex/instructions.md` now exists and defines Slotwise-specific reading order, backend boundaries, and phase discipline.
- `.codex/rules/code-standards.md` now exists and defines backend layering, TypeScript, persistence, error-handling, testing, and change-discipline expectations.
- `.codex/rules/strict-resource-management.md` now exists and defines database lifecycle, external API, request-response ownership, cleanup, and test-isolation expectations.

## Known Gaps
- `.env.example` now documents required configuration keys.
- Real `.env` exists under `src`; do not print or commit secrets.
- Git metadata is present for this workspace.
- No lint or format tooling is configured yet.
- Global `npm` works in a normal unsandboxed shell on this machine and was verified at `11.16.0` on June 16, 2026.
- In the Codex PowerShell/sandbox path, bare `npm` can still fail because `C:\Program Files\nodejs\npm.ps1` selects `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`, which the sandbox cannot read/execute. Outside the sandbox, normal `npm` works; inside Codex, use `C:\Program Files\nodejs\npm.cmd` or `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`.
- CI is not configured because there is no confirmed Git provider/repository attached to this workspace.
- Full browser visual QA remains pending because the Codex Windows sandbox has historically failed to launch the in-app browser runtime.

## Recent Safe Fixes
- Partial booking updates verify email only when `email` is provided.
- Booking get/update/delete return `404` when no booking is found.
- Successful booking delete returns an empty `204` response.
- Booking schema/interface no longer collect `password`; serialization strips legacy password values from API output.
- Automated tests now cover validator behavior, selected service rules, and controller status handling.
- Preferred REST routes now exist alongside legacy route compatibility paths.
- Full availability checks now use `startDate`, `endDate`, `timein`, and `timeout`.
- Owner/admin role-gated booking approval and rejection endpoints now exist.
- Booking lifecycle now supports approval, rejection, cancellation, and completion with status-transition checks.
- Booking status changes now append audit history entries with role, optional actor id, optional reason, and timestamp.
- Booking responses now include derived `conflictRisk` metadata so operators can quickly spot urgent or operationally risky bookings before approval.
- Booking mutations now persist `conflictRisk` snapshots, and booking list reads can filter by `conflictRiskLevel`.
- `GET /bookings/timeline` now exposes a backend timeline feed grouped by booking day with sorted entries and summary counts.
- `GET /bookings/insights/dashboard` now exposes dashboard-ready KPI, funnel, utilization, and peak-time analytics from current booking data.
- `POST /bookings/suggestions` now returns ranked nearby available slots using the existing availability engine and business scheduling rules.
- Approved bookings can now be marked as `no_show`, and `GET /bookings/insights/cancellation-no-show` exposes lifecycle analytics.
- Business profiles can now use optional `templateKey` presets, and managers can inspect the available templates through `/businesses/templates`.
- Business profiles can now persist `widgetSettings`, and public consumers can fetch widget bootstrap data through `/businesses/public/:slug/widget`.
- Business profiles can now persist `publicPageSettings`, and public consumers can fetch hosted booking-page config through `/businesses/public/:slug/booking-page`.
- Privileged status-action routes now require persistent operator login and bearer sessions.
- Legacy bookings with empty `statusHistory` now surface a synthetic baseline entry and persist one on the next status change.
- Booking filter queries now rely on normalized searchable fields with index support, plus a one-time legacy backfill for older records.
- MongoDB SRV connections can now use optional `SLOTWISE_DNS_SERVERS` overrides when local DNS resolvers refuse Atlas SRV lookups.
- Ignore rules and editor defaults are now in place, but lint/format tooling is still intentionally deferred until the repository has a chosen CI/workflow baseline.
- Cookie-session CSRF protection, configured CORS, production HTTPS/proxy/cookie validation, and auth route rate limiting are now in place.
- Business-scoped authorization middleware now protects business, booking, customer, service-resource, timeline, and insight routes where business scope is required, including protected business-profile collection creation.
- Operator invitation, invitation acceptance, password reset, role update, activation, and deactivation foundations now exist.
- Audit-log persistence, API access, and frontend audit visibility now exist. Admin audit-log reads are scoped to the admin actor business; owners can query across businesses.
- Migration registry, migration state persistence, core index synchronization migration, dry-run/status commands, and first-owner setup now exist.
- API observability now includes request IDs, structured logs, health/readiness routes, and safe error/not-found middleware.
- Backend business-profile list reads now honor `businessId`, giving the frontend a backend-supported way to request the active session business only.
- Non-owner frontend admin/staff views now pass session business scope into booking, timeline, dashboard, customer, resource, and settings queries instead of relying on broad collection reads.
- `/admin/bookings` now exposes general booking edit, owner/admin delete, and lifecycle reason submission over the existing booking APIs.
- `/admin/settings` now keeps business creation owner-facing while exposing advanced availability, notification, widget, and public-page settings editors over the existing business APIs.
- Frontend CSRF cookie lookup now uses `VITE_SLOTWISE_CSRF_COOKIE_NAME` with a `slotwise_csrf` fallback so custom backend CSRF cookie names can be mirrored by the SPA.
- Frontend build hardening now includes TypeScript 6 deprecation compatibility and Vite manual chunk splitting; the current production build passes without the prior chunk-size warning.

## Current Execution Plan
- Use `IMPLEMENTATION_PLAN.md` as the active phase plan.
- Use GPT-5 Codex low reasoning for planning and documentation updates.
- Ask immediately before switching to medium for implementation/config/test/rename work.
- Ask immediately before switching to high for architecture, authentication, authorization, security-sensitive logic, multi-business design, payment/notification workflows, or cross-layer changes.
- Current planned direction: staging migration status/dry-run on a network-allowed host, worker smoke checks, browser/accessibility verification, and role-specific UX refinement.
- Phase 13 planning status: the UI/UX brief now defines brand direction, admin IA, customer flow structure, responsive behavior, design-system expectations, accessibility requirements, visual-language tokens, screen-composition guidance, interaction-pattern rules, localization/internationalization expectations, operational UX standards, and remaining frontend planning gaps.
- Phase 14 planning status: the frontend implementation roadmap selected the React + Vite + React Router + TanStack Query direction and lists admin, customer, public booking-page, widget, component, API, state, localization, accessibility, and verification expectations behind the current frontend.
- Phase 14 scaffold status: `frontend/` now exists with an operational admin dashboard shell, API envelope client foundation, memory-only session store, Tailwind styling, Vitest setup, and passing install/build/test/audit/HTTP smoke verification.
- Phase 12 progress: smart booking suggestions, conflict-risk indicators, booking timeline feed, no-show insights, business templates, widget config, public booking-page customization, and analytics dashboard backend support are now implemented.
- Phase 12 template progress: restaurant, clinic, salon, consulting, venue, rental, and fitness presets now exist for business-profile setup, while automatic resource seeding remains deferred.
- Current Phase 12 progress note: no-show-history analytics now have a backend source of truth through the `no_show` lifecycle and insights endpoint.
- Current Phase 12 widget progress note: public widget config is available by business slug, and Phase 16.18 now adds the dedicated compact `/widget/:slug` embed frontend over that existing backend surface.
- Current Phase 12 public-page progress note: hosted booking-page configuration is available by business slug, and Phase 16.16 now adds the dedicated `/book/:slug` frontend booking flow over that existing backend surface.
- Phase 11 foundation progress: shared business-profile, service-resource, and customer models are wired into repositories, services, routes, and booking workflows.
- Booking workflow progress: bookings can now carry optional `businessId`, `customerId`, `serviceResourceId`, `partySize`, `notes`, notification plans, and reschedule history, with business-aware scheduling validation in the service layer.
- Phase 11 completion progress: business management routes, service/resource management routes, customer management routes, staff sessions, and customer self-service cancel/reschedule flows are now implemented.
- Follow-up hardening progress: persistent auth, notification data models, cookie security, CSRF, rate limits, tenant authorization, operator account management, scoped audit logs, migrations, first-owner setup, worker separation, and observability foundations now exist.
- Operator hardening progress: `/auth/session` now resolves against persistent operator accounts and TTL-backed auth sessions instead of in-memory session state.
- Customer hardening progress: customer magic-link verification tokens and persistent customer sessions now exist, and customer booking self-service routes are session-protected.
- Notification hardening progress: queued auth and booking emails now have a provider-backed outbox worker with retry handling and a safe local `noop` mode.
- Current architecture progress: the booking repository boundary now exists, and booking service persistence calls flow through `BookingRepository`.
- Current auth progress: status-action routes require `/auth/session` login and persistent sessions. Production operator setup is managed through first-owner setup plus owner-controlled invitations; env-configured owner/admin/staff credentials are local/test-only and rejected in production.
- Phase 15 audit status: dependency inventory, `npm audit`, and `npm outdated` can run through normal unsandboxed npm or through `C:\Program Files\nodejs\npm.cmd` inside Codex; the repository dependency modernization work is now complete.
- Phase 15 current status: runtime packages are modernized within the approved scope, audit status is 0 vulnerabilities after approved non-force repair of `form-data` to `4.0.6`, and compile/tests pass after scoping backend TypeScript to `src/**/*.ts`.
- Phase 16 status: frontend/backend feature alignment is complete through the core admin/customer/public/widget surfaces.
- Phase 16 closure status: the July 5, 2026 alignment pass added business-scope query propagation, backend business-list filtering, business-profile create route scope guarding, owner-only settings business creation controls, booking edit/delete/lifecycle reasons, advanced settings editing, and Vite chunk/build hardening.
- Frontend localization/import status: Stage 6 Customers localization is complete, and frontend source imports are standardized on `@/`; backend relative imports remain unchanged pending a runtime-safe alias strategy.
- Current package status: root and frontend audits report 0 vulnerabilities; root `npm outdated` is clean; frontend `npm outdated` only reports the deferred `react-router` major from `7.18.1` to `8.1.0`.
- Phase 17 status: production-readiness hardening foundations are implemented, including CSRF, cookie/CORS/proxy hardening, auth rate limiting, runtime validation, tenant authorization, operator account administration, scoped audit logs with mutation coverage for booking/business/customer/resource flows, migration registry, first-owner setup, worker separation, request IDs, structured logging, health/readiness, role-aware frontend portals, forbidden state, and light/dark theme foundation. Chrome-backed local route and axe smoke passed for the public/auth routes, live Atlas migration status/dry-run are verified, and authenticated role-specific staging browser QA remains the next step.
- Remaining environment-level gap: machine Node is `v26.3.0` Current as of June 16, 2026; official Node metadata lists `v24.16.0` as Latest LTS and the v23 line as EOL. Moving the machine to LTS remains blocked by the prior Windows Installer administrator requirement unless an admin performs the install/uninstall step.
- Current database connectivity status: live Atlas verification passes outside the restricted sandbox. `npm run migrate:status` reports `20260616-sync-core-indexes` applied, and `npm run migrate:dry-run` reports it skipped.
