# Project Context

## Snapshot
- Project: Slotwise
- Package: `slotwise-api`
- Current repository folder: `Booking System`
- Target repository folder: `Slotwise`
- Root folder rename status: source/docs/tests are stable; renaming the live workspace folder should be done externally after closing or retargeting tools bound to the current path.
- Type: TypeScript/Node.js backend API
- Runtime: Node.js
- Framework: Express
- Database: MongoDB through Mongoose
- External integration: Hunter email verifier API
- Product direction: flexible booking platform for reservations, appointments, services, spaces, resources, and event scheduling.

## Current Structure
- `src/app.ts` starts the Express app after MongoDB connects, mounts booking routes, and listens on configured `PORT` or fallback `3000`.
- `src/config/env.ts` loads environment variables from root `.env`, falls back to `src/.env` for the current legacy layout, exposes required env validation, and provides the port fallback.
- `src/config/db.ts` validates `MONGODB_URI` and connects Mongoose.
- `src/routes/booking.routes.ts` defines booking CRUD HTTP routes and exposes both preferred REST aliases and legacy compatibility routes.
- `src/routes/auth.routes.ts` defines operator session login plus customer magic-link request/verify flows, current-session lookup, and logout routes.
- `src/routes/business-profile.routes.ts`, `src/routes/service-resource.routes.ts`, and `src/routes/customer.routes.ts` expose Phase 11 management APIs.
- `src/controllers/booking.controller.ts` translates HTTP requests into service calls.
- `src/controllers/auth.controller.ts` handles operator session creation and revocation.
- `src/controllers/business-profile.controller.ts`, `src/controllers/service-resource.controller.ts`, and `src/controllers/customer.controller.ts` map Phase 11 business-domain HTTP flows.
- `src/services/booking.service.ts` contains booking creation, availability, email verification, and CRUD logic.
- `src/services/auth.service.ts` now manages Argon2-verified operator login, startup bootstrap seeding, customer magic-link verification, and MongoDB-backed hashed opaque sessions.
- `src/services/notification-outbox.service.ts` now processes queued notification jobs through provider-backed delivery with retries and worker lifecycle controls.
- `src/services/business-profile.service.ts`, `src/services/service-resource.service.ts`, and `src/services/customer.service.ts` own the new business-domain management logic.
- `src/repositories/booking.repository.ts` owns booking persistence queries and Mongoose model access.
- `src/repositories/business-profile.repository.ts`, `src/repositories/service-resource.repository.ts`, and `src/repositories/customer.repository.ts` now own the first Phase 11 business-domain persistence queries.
- `src/middleware/requireRole.ts` enforces authenticated operator sessions and owner/admin role checks for privileged booking actions.
- `src/models/booking.model.ts` defines the Mongoose booking schema.
- `src/models/business-profile.model.ts` defines business profile settings, working hours, blackout dates, notification settings, and business-member role assignments.
- `src/models/service-resource.model.ts` defines bookable services/resources such as staff, rooms, tables, equipment, appointments, and events.
- `src/models/customer.model.ts` defines reusable customer records scoped to a business.
- `src/models/operator-account.model.ts` defines persistent operator accounts for owner/admin/staff authentication.
- `src/models/auth-session.model.ts` defines persistent sessions with TTL expiry and revocation support.
- `src/models/verification-token.model.ts` defines short-lived customer authentication tokens.
- `src/models/notification-job.model.ts` defines notification outbox jobs for delivery processing.
- `src/interfaces/booking.interface.ts` defines the booking document type.
- `src/interfaces/business.interface.ts`, `src/interfaces/service-resource.interface.ts`, and `src/interfaces/customer.interface.ts` define the Phase 11 business-domain contracts.
- `src/interfaces/operator-account.interface.ts`, `src/interfaces/auth-session.interface.ts`, `src/interfaces/verification-token.interface.ts`, and `src/interfaces/notification-job.interface.ts` define the post-Phase 11 auth/notification persistence contracts.
- `src/utils/validators.ts` contains field validators.
- `src/utils/emailVerifier.ts` calls Hunter's email verification API.
- `src/middleware/businessDomainValidation.ts` validates business-profile, service-resource, and customer management requests.
- `src/utils/authCrypto.ts` centralizes Argon2 password hashing plus opaque token/session id helpers.
- `src/utils/notificationTemplates.ts` renders transactional notification content for auth and booking flows.
- `tests/*.test.js` contains Node built-in tests for validators, service logic, and controller behavior against compiled output.
- `README.md` documents setup, routes, examples, and known gaps.
- `UI_UX_DESIGN_BRIEF.md` now acts as the active Phase 13 frontend planning artifact.
- `FRONTEND_IMPLEMENTATION_ROADMAP.md` now acts as the active Phase 14 frontend implementation planning and selection artifact.
- `frontend/` now contains the first isolated Vite + React + TypeScript frontend scaffold for Slotwise.
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
- No Git repository was detected from the workspace root.
- No lint or format tooling is configured.
- Global `npm` now works in a normal unsandboxed shell on this machine and was verified at `11.16.0` on June 11, 2026.
- In the Codex sandbox, `npm` can still fail because the shim resolves through `C:\Users\omarz\AppData\Roaming\npm\...`, but outside the sandbox the normal `npm` command works and `npm run build` and `npm test` were both re-verified successfully on June 11, 2026.
- CI is not configured because there is no confirmed Git provider/repository attached to this workspace.

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
- Privileged status-action routes now require env-backed operator login and bearer sessions.
- Legacy bookings with empty `statusHistory` now surface a synthetic baseline entry and persist one on the next status change.
- Booking filter queries now rely on normalized searchable fields with index support, plus a one-time legacy backfill for older records.
- MongoDB SRV connections can now use optional `SLOTWISE_DNS_SERVERS` overrides when local DNS resolvers refuse Atlas SRV lookups.
- Ignore rules and editor defaults are now in place, but lint/format tooling is still intentionally deferred.

## Current Execution Plan
- Use `IMPLEMENTATION_PLAN.md` as the active phase plan.
- Use GPT-5 Codex low reasoning for planning and documentation updates.
- Ask immediately before switching to medium for implementation/config/test/rename work.
- Ask immediately before switching to high for architecture, authentication, authorization, security-sensitive logic, multi-business design, payment/notification workflows, or cross-layer changes.
- Current planned direction: professional business features, creative differentiators, and a future admin/customer frontend.
- Phase 13 planning status: the UI/UX brief now defines brand direction, admin IA, customer flow structure, responsive behavior, design-system expectations, accessibility requirements, visual-language tokens, screen-composition guidance, interaction-pattern rules, localization/internationalization expectations, operational UX standards, and remaining frontend planning gaps.
- Phase 14 planning status: the frontend implementation roadmap now selects a future React + Vite + React Router + TanStack Query direction and lists needed admin, customer, public booking-page, widget, component, API, state, localization, accessibility, and verification work while deferring package/source implementation.
- Phase 14 scaffold status: `frontend/` now exists with an operational admin dashboard shell, API envelope client foundation, memory-only session store, Tailwind styling, Vitest setup, and passing install/build/test/audit/HTTP smoke verification.
- Phase 12 progress: smart booking suggestions, conflict-risk indicators, booking timeline feed, no-show insights, business templates, widget config, public booking-page customization, and analytics dashboard backend support are now implemented.
- Phase 12 template progress: restaurant, clinic, salon, consulting, venue, rental, and fitness presets now exist for business-profile setup, while automatic resource seeding remains deferred.
- Current Phase 12 progress note: no-show-history analytics now have a backend source of truth through the `no_show` lifecycle and insights endpoint.
- Current Phase 12 widget progress note: public widget config is now available by business slug, but the dedicated hosted embed/frontend experience remains deferred.
- Current Phase 12 public-page progress note: hosted booking-page configuration is available by business slug, and Phase 16.16 now adds the dedicated `/book/:slug` frontend booking flow over that existing backend surface.
- Phase 11 foundation progress: shared business-profile, service-resource, and customer models now exist and are ready to be wired into repositories, services, routes, and booking workflows.
- Booking workflow progress: bookings can now carry optional `businessId`, `customerId`, `serviceResourceId`, `partySize`, `notes`, notification plans, and reschedule history, with business-aware scheduling validation in the service layer.
- Phase 11 completion progress: business management routes, service/resource management routes, customer management routes, staff sessions, and customer self-service cancel/reschedule flows are now implemented.
- Follow-up hardening progress: persistent auth and notification data models now exist; the old in-memory/env auth flows are about to be migrated onto them.
- Operator hardening progress: `/auth/session` now resolves against persistent operator accounts and TTL-backed auth sessions instead of in-memory session state.
- Customer hardening progress: customer magic-link verification tokens and persistent customer sessions now exist, and customer booking self-service routes are session-protected.
- Notification hardening progress: queued auth and booking emails now have a provider-backed outbox worker with retry handling and a safe local `noop` mode.
- Current architecture progress: the booking repository boundary now exists, and booking service persistence calls flow through `BookingRepository`.
- Current auth progress: status-action routes now require `/auth/session` login and bearer sessions backed by env-configured owner/admin/staff credentials; persistent user/session storage remains future work.
- Phase 15 audit status: dependency inventory, `npm audit`, and `npm outdated` can run through the bundled CLI fallback; the repository dependency modernization work is now complete.
- Phase 15 current status: runtime packages are modernized to current direct versions, audit status is 0 vulnerabilities, and compile/tests pass after small compatibility fixes in env loading, controller param typing, Mongoose `_id` typing, and date-validator `this` handling.
- Phase 16 status: frontend/backend feature alignment is now the active frontend implementation phase; the coverage matrix, route-map/app-shell routing, shared API DTO/client modules, operator auth/memory-session flow, query-backed bookings list, booking detail drawer, role-aware lifecycle actions, operator reschedule/suggestion flows, timeline frontend coverage, dashboard analytics, cancellation/no-show insights, customer management, business settings with template preview, service/resource management screens, public booking page flow, shared admin states, and responsive/accessibility QA pass are complete. Customer magic-link flows, widget UI foundation, persistent token storage, and automatic template resource seeding remain separate approval gates.
- Remaining environment-level gap: machine Node is still `v23.6.0` on an EOL line, and upgrading it to LTS `24.16.0` is blocked by a Windows Installer admin requirement.
- Current database connectivity gap: Resolved. Active database connectivity is established to the new `slotwise-dev` MongoDB Atlas cluster in `EU_CENTRAL_1` Frankfurt.
