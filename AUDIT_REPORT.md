# Audit Report

## Summary
Initial audit found a compact Express/Mongoose booking API with missing project documentation, missing tests, and several configuration and security risks.

## Findings

### High
- Legacy identity remains only in the current workspace folder name `Booking System`; package metadata now uses `slotwise-api` and source files now use dot-case naming.
- Environment/toolchain risk remains outside the repo: current Node is `v26.3.0` as of June 16, 2026, which official Node.js release metadata lists as Current/Latest Release rather than LTS. The official LTS target is `v24.16.0`; moving this machine to that LTS line remains blocked by the prior administrator-only Windows installer/uninstall step unless an admin performs it.

### Medium
- Operator authentication now exists for privileged booking actions, but it is still env-backed and uses in-memory sessions rather than a persistent user/session store.
- MongoDB SRV resolution can now be overridden with `SLOTWISE_DNS_SERVERS`, but the active `MONGODB_URI` hostname still returns `ENOTFOUND` against public DNS.
- The machine-level `npm` issue is not a normal-shell blocker: outside the sandbox, `npm` works at `11.16.0`, and `npm run build` plus `npm test` both pass through the standard npm workflow on June 16, 2026.
- The Codex PowerShell/sandbox path can still make bare `npm` fail because `C:\Program Files\nodejs\npm.ps1` selects `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`, which the sandbox cannot read/execute. `C:\Program Files\nodejs\npm.cmd` and the bundled CLI path work as the Codex workaround.
- Dependency updates exposed one TypeScript compatibility issue in `src/interfaces/booking.interface.ts`; it was fixed by making `_id` required to match the updated Mongoose `Document` typing.
- `dotenv` 17 changed runtime logging behavior; `src/config/env.ts` now sets `DOTENV_CONFIG_QUIET` and passes `quiet: true` so tests and startup stay quiet.
- Express 5 tightened route-param typing; `src/controllers/booking.controller.ts` now uses `Request<{ id: string }>` for the `:id` handlers.
- Mongoose 9 tightened schema-validation typing; `src/utils/validators.ts` now uses a minimal local cast inside `endDateValidator`, and `src/interfaces/booking.interface.ts` keeps `_id` required as `mongoose.Types.ObjectId`.

### Low
- No linting or formatting tools.
- Frontend implementation is still deferred, but the Phase 13 UI/UX planning brief now exists and covers brand, admin, customer, responsive, design-system, and accessibility direction.
- Phase 14 frontend planning is now documented in `FRONTEND_IMPLEMENTATION_ROADMAP.md`; it selects a future React + Vite + React Router + TanStack Query direction without adding frontend packages or source code.
- The Phase 14 roadmap now includes a pre-scaffold approval/fix process so frontend architecture/package adoption, package security review, token/session storage, deployment topology, SSR/pre-rendering, and widget style isolation are resolved before implementation begins.
- User approval resolved the Phase 14 planning decisions: candidate package adoption is approved for implementation-time review, first-slice token storage is memory-only, deployment defaults to a separate static SPA, SSR/pre-rendering is deferred, and third-party widget isolation defaults to iframe embeds.
- Phase 14 implementation-time package review completed against npm metadata on June 13, 2026; no immediate license blocker was found for the approved first-slice frontend package set.
- The isolated `frontend/` scaffold now exists and verification passed for install, production build, Vitest tests, npm audit, and a local Vite HTTP smoke check.
- In-app browser QA is currently blocked by a Windows sandbox browser runtime failure: `CreateProcessAsUserW failed: 5`.
- Phase 13 planning is stronger than a generic high-level brief now: it also defines visual-language tokens, screen-composition expectations, admin/customer interaction patterns, hosted booking-surface direction, analytics presentation rules, and product-copy guidance.
- Localization had been a planning gap; the Phase 13 brief now includes locale-aware copy structure, formatting, timezone clarity, layout-resilience, and RTL-readiness guidance.
- Frontend planning gaps are now more explicit: the brief includes a checklist for screen inventory, role-based UX differences, state coverage, component inventory, public-surface constraints, API contract readiness, and design QA before implementation begins.

## Resolved
- Added smart booking suggestions so Slotwise can recommend nearby available alternatives without a separate scheduling engine.
- Added derived booking conflict-risk indicators on booking responses so operators can spot urgent or operationally risky bookings before approval without requiring a schema migration.
- Persisted booking conflict-risk snapshots and exposed list filtering by `conflictRiskLevel`.
- Enriched conflict-risk scoring with actionable operational context from existing data: adjacent booking pressure and heavy same-day load.
- Added a dedicated no-show lifecycle state and cancellation/no-show insights endpoint so this analytics area now has a backend source of truth.
- Added reusable business template presets and template discovery endpoints so multiple business verticals can start from opinionated defaults instead of manual per-profile setup.
- Added persisted widget settings plus a public widget-config endpoint so businesses now have a backend-ready embeddable booking surface without introducing a second booking engine.
- Added persisted public booking-page settings plus a public booking-page config endpoint so businesses now have a hosted-page customization surface ready for a future frontend.
- Added Phase 11 domain foundations for business profiles, service/resources, and customer records with Mongoose validation and indexing.
- Added `.env.example` for non-secret config documentation.
- Centralized env loading in `src/config/env.ts`, preferring root `.env` with a temporary `src/.env` fallback.
- Added required env validation for `MONGODB_URI` and `HUNTER_API_KEY` usage.
- Added a default server port of `3000`.
- Changed startup so the server listens only after MongoDB connects, and connection failure stops startup.
- Fixed `updateBooking` so Hunter email verification only runs when an email update is supplied.
- Fixed get/update/delete missing-record behavior to return `404`.
- Fixed successful delete behavior to return an empty `204` response.
- Added automated tests for validators, booking service behavior, and controller status handling.
- Fixed `phoneValidator` so valid phone numbers return an explicit boolean `true` instead of `undefined`.
- Added REST-style booking route aliases while preserving legacy endpoints.
- Added `README.md` with setup, route reference, examples, and current limitations.
- Added `.gitignore` and `.editorconfig` for repository and editor hygiene.
- Added `.codex/instructions.md`, `.codex/rules/code-standards.md`, and `.codex/rules/strict-resource-management.md` for Phase 9 governance.
- Introduced `BookingRepository` so booking service no longer directly depends on the Mongoose booking model.
- Polished touched booking service methods with explicit public contracts and removed raw error-object concatenation from `getAllBookings`.
- Reworked availability checks to use `startDate`, `endDate`, `timein`, and `timeout`.
- Added owner/admin role-gated booking approval and rejection endpoints.
- Added owner/admin booking cancellation and completion endpoints plus service-level lifecycle transition checks.
- Added booking list filtering, pagination, and sorting to reduce unbounded list-read behavior.
- Added route-level request validation for booking payloads, list queries, and route ids.
- Generic booking update routes now reject direct `status` edits so lifecycle status changes flow through status-action endpoints.
- Added standard JSON response envelopes for successful data responses and handled errors.
- Added `statusHistory` audit entries to booking documents for status changes.
- Added operator login and bearer-session authentication for privileged booking status actions.
- Replaced lazy booking-metadata backfill with an explicit maintenance script.
- Historical Phase 15 npm shim notes are superseded by the June 16, 2026 closure check: normal unsandboxed npm works, while bare sandboxed `npm` can still fail through the roaming npm PowerShell shim path.
- On June 10, 2026, a fresh Phase 15 check reconfirmed that `npm --version` fails because the active npm shim points to a missing roaming npm installation path.
- On June 10, 2026, the bundled npm CLI at `C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js` was verified as a working fallback for `npm ls --depth=0`, `npm audit`, and `npm outdated`.

## Documentation Drift
No existing project documentation was found, so there is no implementation-vs-doc mismatch yet. The immediate issue is documentation absence.

## Planning Update
- `.codex/rough-request.prompt.md` is now the project-local rough-request template.
- `.codex/` is the preferred instruction directory; `.agents/` is legacy fallback only if present.
- `.codex/instructions.md` now exists as the Slotwise-specific Codex entrypoint for reading order, phase discipline, architecture boundaries, and safe working rules.
- `.codex/rules/code-standards.md` now exists and defines the expected layering, typing, persistence, error-handling, testing, and change-discipline rules for backend work.
- `.codex/rules/strict-resource-management.md` now exists and defines shared rules for database lifecycle, external API usage, request-response ownership, cleanup expectations, and test isolation.
- `IMPLEMENTATION_PLAN.md` now owns the phased remediation plan and model matrix.
- `IMPLEMENTATION_PLAN.md` now includes planned Slotwise phases 8-14 for identity, structure, architecture, mandatory platform features, professional business features, creative differentiators, UI/UX planning, and deferred frontend implementation.
- Medium/high work now requires immediate model-switch approval before implementation starts.
- Phase 15 now tracks dependency audit, vulnerability fixes, package updates, major-version migrations, and justified modern package adoption.
- Phase 16 now tracks frontend/backend feature alignment and full frontend component coverage, with dependency modernization preserved as the completed Phase 15.
- The first Phase 16 coverage matrix shows that the current frontend scaffold covers only a static admin shell, static queue/timeline examples, API envelope basics, and memory-session storage; live routes, DTOs, forms, customer portal, public booking page, and widget UI remain to be implemented.
- Phase 16.2 route coverage is now improved: the frontend has a central route map, real React Router navigation, admin route placeholders, and public-surface routes, but the routes are not yet query-backed and do not yet include forms or auth guards.
- Phase 16.3 API contract coverage is now improved: typed frontend DTOs and endpoint modules exist for the implemented backend surfaces, but most screens are not yet wired to TanStack Query or live mutation states.
- Phase 16.4 operator auth coverage is now improved: admin routes redirect to `/login`, successful operator login stores the returned session in memory only, and the shell exposes operator session context plus logout.
- Phase 16.5 booking-list coverage is now improved: `/admin/bookings` consumes `GET /bookings` through TanStack Query with customer search, status/risk filters, sorting, pagination metadata, and loading/error/empty states.
- Phase 16.6 booking-detail coverage is now improved: `/admin/bookings` can open a read-only detail drawer backed by `GET /bookings/:id`, including contact details, schedule, notes, conflict-risk signals, operational IDs, and status history.
- Phase 16.7 booking-lifecycle coverage is now improved: the booking detail drawer exposes role-aware approve, reject, cancel, complete, and no-show actions using existing backend lifecycle routes, confirmation prompts, mutation states, and query refresh.
- Phase 16.8 booking-reschedule coverage is now improved: the booking detail drawer exposes operator-only reschedule and nearby suggestion flows using existing backend routes, confirmation prompts, mutation states, and query refresh.
- Phase 16.9 timeline coverage is now improved: `/admin/timeline` consumes `GET /bookings/timeline` with filters, summary metrics, day-grouped entries, status chips, conflict-risk markers, and reschedule badges.
- Phase 16.10 dashboard analytics coverage is now improved: `/admin` consumes `GET /bookings/insights/dashboard` with KPI cards, lifecycle funnel bars, weekday/resource utilization, peak-time panels, dashboard filters, and loading/error/empty states.

## Implementation Risks To Carry Forward
- Configuration fixes may intentionally fail startup earlier when required env vars are missing.
- Existing database records may still contain old password fields; cleanup requires a separate approved migration/data-retention task.
- Route polish should preserve existing routes unless a breaking API change is approved.
- Tests should mock MongoDB and Hunter API rather than depending on live external services.
- Source/package/folder renames can break imports, compiled test paths, package metadata, workspace references, and documentation links; Phase 8 now includes explicit mitigation tasks instead of excluding this risk.
- Root folder rename can invalidate local terminal paths, editor/workspace state, and absolute Markdown links; Phase 8 requires it to happen only after source/docs/tests are stable.
- Dependency upgrades can break runtime behavior, TypeScript types, tests, or external integration behavior; Phase 15 requires small updates, compile/tests after each change, and explicit major-upgrade migration notes.
- New packages can increase security and maintenance burden; Phase 15 requires a purpose, maintenance check, security check, and documentation update before adoption.
- Machine-level npm repair is still desirable, but it is no longer a blocker for read-only Phase 15 audit commands because the bundled CLI fallback works.
- Phase 16 frontend implementation can still drift from backend DTOs because the current DTOs are manually maintained; generated contracts or broader contract tests remain future hardening.
- Phase 16 auth, customer magic-link, persistent session, and future lifecycle expansion work must stay approval-gated because token handling and booking status actions are security-sensitive.
- Phase 16.4 intentionally does not persist sessions across refreshes; persistent login still requires a separate backend cookie-session review.
- Browser visual QA remains limited by the in-app browser runtime failure, so Phase 16 visual confidence currently comes from responsive CSS review, route/component tests, Vite build, and local HTTP smoke checks.

## Phase 4 Security Review
- Removed `password` from `src/interfaces/booking.interface.ts` and `src/models/booking.model.ts`.
- Removed the unused `PasswordValidator`.
- Added booking schema `toJSON`/`toObject` transforms to strip `password` if legacy document data includes it.
- No hashing dependency was added because credentials do not belong in the booking domain model.
- Existing persisted password fields, if any, should be cleaned up in a separate migration after confirming data retention requirements.

## Phase 5 Test Coverage
- Added `tests/validators.test.js` for name, email, phone, future date, and end date validation.
- Added `tests/bookingService.test.js` for update-without-email behavior and overlap rejection.
- Added `tests/bookingController.test.js` for `404` and `204` response handling.
- Tests are dependency-light and use Node's built-in test runner against compiled output.

## Phase 6 API Polish
- Added preferred REST aliases on `/bookings` for create, list, read, update, and delete.
- Preserved existing legacy routes to avoid client breakage.
- Added `tests/bookingRoutes.test.js` to verify both alias and legacy route registration.
- Added admin approval/rejection endpoints first behind an owner/admin boundary; later mitigation work replaced the header-only gate with bearer-session auth.

## Phase 7 DevOps Policy
- Added `.gitignore` to exclude dependencies, build output, IDE files, logs, and env files.
- Added `.editorconfig` to standardize line endings, indentation, and trailing whitespace policy.
- Chose documentation-first maintenance policy instead of installing ESLint/Prettier because there is no agreed repository/CI baseline yet.
- CI remains intentionally deferred until the workspace is attached to a real Git provider/repository and a concrete team workflow is chosen.

## Phase 15 Inventory Snapshot
- Final runtime dependencies confirmed from manifest, lockfile, and `npm ls --depth=0`: `axios@1.17.0`, `dotenv@17.4.2`, `express@5.2.1`, `libphonenumber-js@1.13.6`, `mongoose@9.7.0`, `validator@13.15.35`.
- Final development dependencies confirmed from manifest, lockfile, and `npm ls --depth=0`: `@types/express@5.0.6`, `@types/validator@13.15.10`, `nodemon@3.1.14`, `ts-node@10.9.2`.
- Obsolete dependency removed: `@types/mongoose`.
- `npm ls --depth=0` succeeded through `C:\Program Files\nodejs\npm.cmd` and matched the final manifest inventory.

## Phase 15 Audit Snapshot
- Initial `npm audit` reported 17 vulnerabilities: 4 low, 3 moderate, 8 high, and 2 critical.
- Direct dependency findings include `axios`, `express`, `mongoose`, and `validator`.
- Transitive findings include `body-parser`, `cookie`, `path-to-regexp`, `qs`, `send`, `serve-static`, `follow-redirects`, `form-data`, `brace-expansion`, `braces`, `diff`, `minimatch`, and `picomatch`.
- The approved June 16, 2026 non-force `npm audit fix` updated the vulnerable `form-data` path to `4.0.6`.
- Follow-up audit state is now 0 vulnerabilities, so no `npm audit fix --force` pass is needed.

## Phase 15 Outdated Snapshot
- Compatible updates were applied with `npm update`.
- `dotenv` has been upgraded to `17.4.2`.
- `express` has been upgraded to `5.2.1` with `@types/express` `5.0.6`.
- `mongoose` has been upgraded to `9.7.0`.
- Deprecated `@types/mongoose` has now been removed.
- Final `npm outdated` state reports a compatible `axios` update from `1.17.0` to `1.18.0`; this is not an audit-force requirement.

## Phase 15 Verification Snapshot
- `npm run build` passes through normal unsandboxed npm on June 16, 2026.
- `npm test` passes through normal unsandboxed npm on June 16, 2026 with 92 tests.
- `node --test tests\*.test.js` passes directly with 92 tests.
- Final `npm audit --audit-level=moderate` passes with 0 vulnerabilities.

## Phase 9 Verification Snapshot
- `.\node_modules\.bin\tsc.cmd` passes after repository extraction.
- `node --test tests\*.test.js` passes with 12 tests after repository extraction.
- `npm test` passes outside the sandbox after the sandboxed command hits the known missing roaming `npm-cli.js` path.
- Targeted search confirms `BookingService` no longer imports or calls the Mongoose booking model directly.
- Touched booking service methods now expose explicit public contracts.

## Phase 10 Verification Snapshot
- `.\node_modules\.bin\tsc.cmd` passes after availability and role-gated admin changes.
- `node --test tests\*.test.js` passes with 19 tests after availability and role-gated admin changes.
- `npm test` passes outside the sandbox with 19 tests after availability and role-gated admin changes.
- Added coverage for role middleware, admin approval/rejection controller behavior, admin route registration, repository-injected service tests, and time-aware availability forwarding.

## Toolchain Follow-up
- Machine Node is `v26.3.0` from `C:\Program Files\nodejs\node.exe` on June 16, 2026.
- Official Node.js release metadata checked on June 16, 2026 lists `v24.16.0` as Latest LTS, `v26.3.0` as Latest Release/Current, and the v23 line as EOL.
- User-level npm is `11.16.0`; normal unsandboxed `npm --version`, `npm run build`, and `npm test` work on June 16, 2026.
- Bare sandboxed `npm --version` still fails in PowerShell because `npm.ps1` selects the roaming CLI path `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`; use `C:\Program Files\nodejs\npm.cmd` or `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js` inside Codex.
- Moving from Node `v26.3.0` Current to Node `v24.16.0` LTS remains a machine-level installer/uninstall task; the previous official MSI attempt failed with Windows Installer error `1730` because administrator rights were required to remove the existing machine-wide Node installation.

## Slotwise Expansion Audit
- Phase 8 standardized product-facing documentation around `Slotwise` and completed package/source renaming without breaking `/bookings` API compatibility.
- Phase 8 package identity now uses `slotwise-api` in `package.json` and the lockfile root metadata.
- Phase 8 source structure now uses `src/routes/booking.routes.ts`, `src/controllers/booking.controller.ts`, `src/services/booking.service.ts`, `src/models/booking.model.ts`, and `src/interfaces/booking.interface.ts`.
- The root workspace folder rename to `Slotwise` was not run inside the active Codex session because the session is bound to the existing workspace path.
- Phase 8 includes mitigation tasks for import/test breakage and root-folder rename risk.
- Phase 9 added coding standards, strict resource-management rules, a `BookingRepository` boundary, and narrow service contract cleanup to reduce persistence coupling.
- Phase 10 is complete: full date-time availability logic, owner/admin status-action endpoints, lifecycle transition checks, filtering, pagination, sorting, request validation, standard responses, and status-change audit trail are implemented.

## Phase 10 Completion Snapshot
- Booking status changes now append `statusHistory` entries with `fromStatus`, `toStatus`, `changedAt`, `changedByRole`, optional `changedBy`, and optional `reason`.
- Status action controllers now read the authenticated operator session and optional body `reason` for audit context.
- `.\node_modules\.bin\tsc.cmd` passes after the audit trail implementation.
- `node --test tests\*.test.js` passes with 31 tests after the audit trail implementation.
- Sandboxed `npm test` still hits the known missing roaming npm shim path, but unsandboxed `npm test` passes with 31 tests.

## Phase 11 Foundation Snapshot
- Added `BusinessProfile`, `ServiceResource`, and `Customer` models as the first Phase 11 implementation slice.
- Business profiles now define business type, timezone, working hours, blackout dates, notification settings, availability rules, and owner/admin/staff member assignments.
- Service/resource records now define business-scoped bookable units such as services, staff, rooms, tables, equipment, appointments, and events.
- Customer records now define reusable business-scoped customer identities with normalized search fields and booking counters.
- `.\node_modules\.bin\tsc.cmd` passes after adding the Phase 11 domain foundations.
- Booking create/update flows now support business-aware scheduling checks, scoped overlap detection, customer upsert hooks, notification planning metadata, and reschedule history metadata.

## Phase 11 Completion Snapshot
- Added protected `/businesses`, `/service-resources`, and `/customers` APIs for Phase 11 business management flows.
- Added staff operator session support through `SLOTWISE_STAFF_*` credentials and bearer sessions.
- Booking lifecycle now supports staff rescheduling plus customer-session-protected cancel/reschedule endpoints.
- Booking and auth notifications now flow through a provider-backed outbox instead of planning metadata alone.
- `.\node_modules\.bin\tsc.cmd` passes after the full Phase 11 implementation.
- `node --test tests\*.test.js` passes with 59 tests after the full Phase 11 implementation.

## Post-Phase 11 Hardening Snapshot
- Added persistent data-model foundations for `OperatorAccount`, `AuthSession`, `VerificationToken`, and `NotificationJob`.
- Auth sessions and verification tokens now have MongoDB TTL expiry support at the model layer.
- Notification jobs now have indexed outbox storage for future provider-backed email delivery processing.
- `.\node_modules\.bin\tsc.cmd` passes after adding the post-Phase 11 hardening foundations.
- `/auth/session` now authenticates against persistent operator accounts instead of in-memory env credentials at request time.
- Operator passwords now verify through native Node Argon2 hashing, and raw session tokens are stored only as SHA-256 hashes in MongoDB.
- Startup now bootstraps missing operator accounts from env credentials, but runtime session state is no longer in-memory only.
- Customer authentication now uses persisted magic-link verification tokens and customer sessions.
- Customer booking self-service routes now require authenticated customer sessions instead of matching an email string in the request body.
- Notification jobs now process through a worker with template rendering, retries, and provider-backed email delivery support.
- Magic-link notification payloads are scrubbed after successful send so raw customer login tokens do not remain in completed jobs.

## Post-Phase 10 Risk Mitigation Snapshot
- Privileged status routes now require env-backed operator login through `/auth/session` and bearer sessions.
- Operator credentials are currently loaded from `SLOTWISE_OWNER_*`, `SLOTWISE_ADMIN_*`, and `SLOTWISE_STAFF_*` environment variables.
- Focused middleware, controller, route, and auth-service tests passed after the auth/session hardening.
- Legacy bookings with empty `statusHistory` now receive a synthetic system-authored baseline entry in API responses.
- Future status changes for older bookings now persist a backfilled legacy baseline entry before appending the real transition.
- Booking list text filters now query normalized indexed fields instead of broad unanchored regex against primary user-facing fields.
- The dedicated booking metadata backfill command exists, but running it is currently blocked by the configured MongoDB host refusing the connection from this machine.
- After adding DNS override support, the backfill diagnosis improved from resolver refusal to `ENOTFOUND`, confirming the active MongoDB SRV hostname itself is invalid.
- Phase 11 business-flexibility features are now implemented for multiple booking use cases.
- Phase 12 is now complete: smart suggestions, conflict-risk indicators, booking timeline feed, no-show insights, business templates, widget config, public booking-page customization, and analytics dashboard backend surfaces are implemented.
- Phase 13 planning is now complete through `UI_UX_DESIGN_BRIEF.md`, covering brand direction, admin/customer structure, responsive layout expectations, design-system guidance, and accessibility requirements.
- The Phase 13 brief now also gives Phase 14 a more opinionated target for screen composition, interaction patterns, hosted public surfaces, analytics presentation, and content tone.
- The Phase 13 brief now also includes localization and internationalization planning so frontend implementation does not treat translation and RTL support as late-stage retrofits.
- The Phase 13 brief now also defines operational UX standards for loading, empty states, errors, privacy, feedback, form resilience, and perceived performance.
- Phase 14 defers frontend implementation until auth, APIs, and design direction are ready.
- Phase 14 now has a frontend implementation roadmap and selection artifact, and its approved package/security review plus pre-scaffold decisions have already led to the isolated `frontend/` workspace.
- The remaining frontend gating is no longer "create `frontend/`"; it is approval for future hardening, auth/storage changes, deployment/runtime shifts, or new package adoption beyond the current scaffold.
- Phase 14 planning risks are now resolved into approved baselines; remaining risks are implementation-time checks for package advisories/version health, API DTO drift, static-hosting/CORS configuration, and memory-token re-authentication tradeoffs.
- Frontend scaffold work is now allowed to proceed under the isolated `frontend/` folder using the reviewed package set.
- Frontend implementation risk remaining after scaffold: visual browser QA still needs to run once the in-app browser runtime is available; API integration remains mocked/static until the next frontend implementation slice.
- Phase 15 covered npm-runtime triage, dependency inventory, security audit, safe fixes, outdated checks, compatible updates, major migrations, obsolete package removal, and guarded modern-package evaluation; the remaining open items are separate follow-up decisions rather than unfinished repository modernization work.
- The Phase 15 closure batch is complete: the sandbox npm shim scope is documented, current Node is corrected to `v26.3.0` Current with `v24.16.0` as the LTS target, lint/format/CI remain deferred for lack of an agreed repository/CI baseline, `npm audit fix --force` is not needed, and no new backend packages were justified.

## Phase 12 Snapshot
- Phase 12.1 smart booking suggestions are complete.
- Added `POST /bookings/suggestions`, which reuses the current availability and business-rule checks to return ranked nearby alternatives.
- Phase 12.2 conflict-risk indicators are complete as the first creative differentiator slice.
- Booking mutations now persist `conflictRisk` snapshots, and `GET /bookings` can filter by `conflictRiskLevel`.
- Conflict-risk scoring now uses `starts_soon`, `approval_stale`, `repeat_reschedule`, `large_party`, `tight_turnaround`, and `heavy_day_load` signals.
- Phase 12.3 booking timeline view is complete as a backend feed.
- Added `GET /bookings/timeline`, which groups matching bookings by start-date day, sorts each day by start time, and exposes per-day summary counts plus duration/reschedule metadata for each booking entry.
- Phase 12.4 no-show and cancellation insights are complete, including an explicit `no_show` lifecycle transition and `GET /bookings/insights/cancellation-no-show`.
- Insights now expose cancellation/no-show rates, service-delivery rate, top recorded reasons, and weekday trend counts from booking lifecycle history.
- Phase 12.5 flexible business templates are complete.
- Business profiles can now opt into template-backed defaults through `templateKey`, and managers can inspect available presets through `GET /businesses/templates` and `GET /businesses/templates/:templateKey`.
- Template presets currently include business rules, working hours, notification defaults, widget defaults, and suggested resource blueprints; automatic resource creation from those blueprints is still deferred.
- Phase 12.6 embeddable booking widget foundation is complete.
- Added persisted `widgetSettings` on business profiles plus a public `GET /businesses/public/:slug/widget` endpoint that returns branding copy, active resource previews, and booking endpoint hints for active businesses by slug.
- The current widget slice is backend-only: there is not yet a dedicated hosted embed frontend, admin visualization, or host-aware public booking app.
- Phase 12.7 public booking page customization is complete.
- Added persisted `publicPageSettings` on business profiles plus a public `GET /businesses/public/:slug/booking-page` endpoint that returns page copy, visibility toggles, optional contact/work-hours data, active resource previews, and booking endpoint hints for active businesses by slug.
- The current public-page slice is also backend-only: there is not yet a dedicated hosted public booking frontend that consumes these settings.
- Phase 12.8 analytics dashboard is complete as a backend feed.
- Added `GET /bookings/insights/dashboard`, which summarizes lifecycle funnel counts, approval/completion/conversion rates, utilization minutes, average party size, busiest weekdays, busiest booking hours, and per-resource utilization slices.
- No new dependency or auth surface was introduced for the current Phase 12 work.
- `.\node_modules\.bin\tsc.cmd` and `node --test tests\*.test.js` both pass after the current Phase 12 implementation, with 92 passing tests in the current suite.
