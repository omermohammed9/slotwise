# Implementation Plan

## Task Type
Documentation | Audit | Configuration | Bug Fix | Security | Test | DevOps | Architecture | Refactor | UX/UI | Feature

## Goal
Evolve the legacy Booking System backend into `Slotwise`: a flexible, professional booking platform for businesses that need reservations, appointments, services, spaces, resources, or event scheduling. Work must stay phased, progress-tracked, quota-conscious, and documentation-first before any broad source, folder, architecture, or UI implementation.

## Model Policy
- Current requested mode: GPT-5.5 low.
- Default execution model: GPT-5 Codex with the lowest sufficient reasoning level.
- Ask immediately before switching to medium or high reasoning.
- Stop before medium/high implementation if approval is not granted.

## Progress Tracking Rules
- Work one small task at a time.
- Use task statuses: `Planned`, `In Progress`, `Done`, `Blocked`, `Deferred`.
- Prefer targeted file reads and targeted `rg` checks instead of broad repository scans.
- Avoid broad rewrites and avoid touching unrelated files.
- After every implementation task, update `IMPLEMENTATION_PLAN.md`, `TASKS_STATUS_MATRIX.md`, `CHANGELOG.md`, and relevant project docs.
- Do not touch `.env`, `node_modules/`, `dist/`, logs, caches, runtime artifacts, or unrelated source files.

## Immediate Model Switch Policy
- Low reasoning: documentation, planning, markdown sync, status tracking, and final summaries.
- Medium reasoning: package metadata, file/folder renames, tests, imports, normal backend implementation, and configuration changes.
- High reasoning: architecture, auth, authorization, security, multi-tenant design, payment/notification workflow, repository extraction, and cross-layer refactors.
- Before medium/high work starts, ask immediately for approval and stop if approval is not granted.

## Model Matrix
| Phase | Task | Required model/reasoning | Switch approval needed | Reason |
|---|---|---|---|---|
| 1 | Governance baseline and planning docs | GPT-5 Codex low | No | Documentation sync and markdown planning. |
| 2 | `.env.example`, dotenv normalization, env validation, `PORT` fallback | GPT-5 Codex medium | Ask before switching from current low | Config touches startup behavior across files. |
| 3 | Partial update validation, delete response, not-found behavior, startup error flow | GPT-5 Codex medium | Ask before switching from current low | Normal implementation and bug fixes. |
| 4 | Password handling decision and implementation | GPT-5 Codex high | Yes | Security-sensitive data model behavior. |
| 5 | Test framework and initial tests | GPT-5 Codex medium | Ask before switching from current low | Adds project tooling and verification coverage. |
| 6 | API route polish, auth/admin approval planning | GPT-5 Codex high for auth, medium for route aliases | Yes for auth/admin design | Auth and authorization are architectural/security-sensitive. |
| 7 | CI/lint/format/build artifact policy | GPT-5 Codex medium | Ask before switching from current low | DevOps/tooling changes affect workflow. |
| 8 | Slotwise identity and structure | GPT-5 Codex medium | Yes | Package, folder, and file renames can break imports/tests. |
| 9 | Architecture and coding standards | GPT-5 Codex high for repository pattern, low for docs | Yes for architecture | Cross-layer structure and coding standards. |
| 10 | Mandatory platform features | GPT-5 Codex medium/high | Yes | Business behavior, validation, auth-adjacent flows. |
| 11 | Professional business features | GPT-5 Codex high | Yes | Multi-business, roles, notifications, and domain expansion. |
| 12 | Creative differentiator features | GPT-5 Codex medium/high | Yes | Product behavior and analytics planning. |
| 13 | Professional frontend/UI/UX planning | GPT-5 Codex low | No | Documentation and design brief only. |
| 14 | Frontend implementation roadmap | GPT-5 Codex high when implemented | Yes | New app architecture and auth-aware UI decisions. |
| 15 | Dependency audit and modernization | GPT-5 Codex medium/high | Yes | Security fixes, package upgrades, new packages, and migration changes can alter runtime behavior. |
| 16 | Frontend/backend feature alignment and full frontend component coverage | GPT-5 Codex medium/high | Yes | Route/API/client/component implementation is medium; auth, lifecycle actions, and customer session flows are high. |

## Phase 1: Documentation And Audit Baseline
Status: In progress

Purpose: Establish reliable project memory before coding.

Files likely touched:
- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`
- `IMPLEMENTATION_PLAN.md`
- `.codex/project-governor.md`
- `.codex/rough-request.prompt.md`

Steps:
1. Confirm `.codex/` is the preferred instruction directory.
2. Record missing `README.md` and `.env.example`.
3. Record current routes, dependencies, external integrations, and known risks.
4. Create this implementation plan and model matrix.

Verification:
- Manual documentation review.
- `rg ".agents|rough-request|Model Matrix|Phase" .codex *.md` where useful.

## Phase 2: Configuration Hygiene
Status: Done

Purpose: Make local setup clear and prevent silent runtime misconfiguration.

Files likely touched:
- `.env.example`
- `src/app.ts`
- `src/config/db.ts`
- `src/utils/emailVerifier.ts`
- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`

Steps:
1. Add `.env.example` with `PORT`, `MONGODB_URI`, and `HUNTER_API_KEY` placeholders.
2. Normalize dotenv loading to one project-root convention.
3. Validate required environment variables before DB/API usage.
4. Add safe default `PORT`, likely `3000`.
5. Avoid printing secret values.

Verification:
- Historical note: `npm run build` was blocked by the old npm shim state at the time of Phase 2; current npm status is documented in Phase 15.
- `.\node_modules\.bin\tsc.cmd` passed.
- Manual startup check still depends on valid MongoDB and Hunter credentials.

Risks:
- Changing env path may break existing local setup unless documented.
- Missing secrets will intentionally fail earlier after validation.

## Phase 3: Safe Bug Fixes
Status: Done

Purpose: Fix incorrect behavior without broad API redesign.

Files likely touched:
- `src/services/booking.service.ts`
- `src/controllers/booking.controller.ts`
- `src/routes/booking.routes.ts` only if route behavior needs smoke checks
- `AUDIT_REPORT.md`
- `TASKS_STATUS_MATRIX.md`
- `CHANGELOG.md`

Steps:
1. In `updateBooking`, only verify email when `bookingData.email` is provided.
2. Preserve existing email quality checks for create/update when email is present.
3. Return `204` with no body for delete, or change to `200` with a body; prefer one consistent semantic.
4. Add not-found behavior for `getBookingById`, `updateBooking`, and `deleteBooking`.
5. Ensure service errors do not hide useful non-secret context.

Verification:
- Historical note: `npm run build` was blocked by the old npm shim state at the time of Phase 3; current npm status is documented in Phase 15.
- `.\node_modules\.bin\tsc.cmd` passed.
- Manual API smoke test still depends on valid MongoDB and Hunter credentials.
- Add tests in Phase 5 because no test harness exists yet.

Risks:
- Not-found behavior changes response contracts.
- Email verification still depends on Hunter API availability.

## Phase 4: Security Review And Password Handling
Status: Done

Purpose: Resolve the high-risk direct password storage in booking documents.

Decision needed:
- Option A: Remove `password` from bookings if this is not an authentication system.
- Option B: Keep `password`, hash it before persistence, and exclude it from responses.
- Option C: Move credentials to a separate user/auth model and keep bookings free of credentials.

Review result:
- No login/authentication flow exists in the current codebase.
- No password comparison or credential verification exists.
- No `User` model implementation exists, despite `userId` referencing `User`.
- The `password` field is currently collected, validated, stored, and returned as ordinary booking data.

Recommendation:
- Option A was implemented: `password` was removed from booking inputs/schema/interface and is stripped from schema serialization.
- Treat any cleanup of already-stored database password values as a separate migration/data-retention decision.
- Choose Option C later only if the project needs real authentication/authorization.
- Avoid Option B unless preserving the current request contract is mandatory, because hashing a booking password still keeps credentials in the wrong domain model.

Files likely touched:
- `src/interfaces/booking.interface.ts`
- `src/models/booking.ts`
- `src/services/booking.service.ts`
- `src/controllers/booking.controller.ts`
- `package.json` and `package-lock.json` if a hashing dependency is approved
- `SYSTEM_MAP.md`
- `AUDIT_REPORT.md`
- `TASKS_STATUS_MATRIX.md`
- `CHANGELOG.md`

Verification:
- Historical note: `npm run build` was blocked by the old npm shim state at the time of Phase 4; current npm status is documented in Phase 15.
- `.\node_modules\.bin\tsc.cmd` passed.
- `rg "password|PasswordValidator" src` shows only the intentional serialization guard.
- Security-focused tests should be added after test framework exists.

Risks:
- Data migration or backward compatibility impact.
- New dependency may be required for hashing.
- Existing stored database password fields, if any, still require a separate approved cleanup/migration.

## Phase 5: Tests
Status: Done

Purpose: Add minimal useful coverage around the highest-risk behavior.

Files likely touched:
- `package.json`
- `package-lock.json`
- test config file such as `jest.config.*` or equivalent
- `src/**/*.test.ts` or `tests/**/*.test.ts`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`

Minimal test targets:
1. Validators: email, phone, future date, end date.
2. Booking service: update without email does not call Hunter; create rejects overlap.
3. Controllers/routes: status codes for create, get, update, delete, and not-found.

Verification:
- `.\node_modules\.bin\tsc.cmd` passed.
- `node --test tests\*.test.js` passed with 10 tests.
- Historical note: npm build/test were blocked by the old npm shim state at the time of Phase 5; current npm status is documented in Phase 15.

Risks:
- Adding a test framework changes dependencies.
- External API and MongoDB should be mocked or isolated.

## Phase 6: API Polish And Admin Flow
Status: Done

Purpose: Improve API consistency and decide whether admin approval/rejection is required.

Files likely touched:
- `src/routes/booking.routes.ts`
- `src/controllers/booking.controller.ts`
- `src/services/booking.service.ts`
- `src/models/booking.ts`
- `README.md`
- `SYSTEM_MAP.md`
- `AUDIT_REPORT.md`
- `TASKS_STATUS_MATRIX.md`
- `CHANGELOG.md`

Steps:
1. Added REST-style aliases: `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id`, `PUT /bookings/:id`, `DELETE /bookings/:id`.
2. Preserved existing routes during transition to avoid breaking clients.
3. Deferred approval/rejection endpoints until authentication/authorization scope is defined.
4. Documented request/response examples in `README.md`.

Verification:
- `.\node_modules\.bin\tsc.cmd` passed.
- `node --test tests\*.test.js` passed with 12 tests.
- Historical note: npm build was blocked by the old npm shim state at the time of Phase 6; current npm status is documented in Phase 15.

Risks:
- Route renaming can break clients.
- Admin actions require auth design and should be treated as security-sensitive.

## Phase 7: DevOps And Maintenance Policy
Status: Done

Purpose: Make project maintenance repeatable.

Files likely touched:
- `package.json`
- lint/format config files if added
- `.gitignore` if a Git repository is initialized later
- `WORKFLOW.md`
- `README.md`
- `CHANGELOG.md`

Steps:
1. Documented build output, dependency, and secret file policy.
2. Added `.gitignore` and `.editorconfig` as lightweight maintenance guardrails.
3. Treated `node_modules/` as local-only dependency cache and `dist/` as disposable build output.
4. Deferred CI because no Git provider/repository and concrete team workflow are agreed yet.

Verification:
- Verified `.gitignore`, `.editorconfig`, and maintenance policy documentation exist.
- No lint/format commands were introduced because tooling installation is intentionally deferred.

## Phase 8: Slotwise Identity And Structure
Status: Done

Purpose: standardize the product direction as `Slotwise` while preserving API compatibility and splitting package, folder, and source rename work into safe, small tasks.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 8.1 Standardize product name as `Slotwise` | Documentation | Done | Low | No | `rg -n -g "*.md" "Booking System|Slotwise|booking-system|slotwise"` |
| 8.2 Rename package identity to `slotwise-api` | Configuration | Done | Medium | Yes | `.\node_modules\.bin\tsc.cmd` |
| 8.3 Plan root folder rename from `Booking System` to `Slotwise` | Configuration | Done | Medium | Yes | Manual workspace path check |
| 8.4 Rename source folders/files to professional conventions | Refactor | Done | Medium | Yes | Compile and tests |
| 8.5 Update imports and tests after each rename | Test | Done | Medium | Yes | `node --test tests\*.test.js` |
| 8.6 Keep `/bookings` routes compatible | Architecture | Done | Medium | Yes | Route tests pass |
| 8.7 Mitigate import/test breakage from renames | Test | Done | Medium | Yes | Compile, tests, targeted `rg` |
| 8.8 Mitigate workspace/root-folder rename risk | DevOps | Done | Medium | Yes | Terminal path and command check |

Planned rename targets:
- Product name: `Slotwise`
- Package name: `slotwise-api`
- Current workspace folder: `Booking System`
- Target workspace folder: `Slotwise`
- `src/routes/booking.routes.ts`
- `src/controllers/booking.controller.ts`
- `src/services/booking.service.ts`
- `src/models/booking.model.ts`
- `src/interfaces/booking.interface.ts`

Verification:
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`
- `rg "Booking System|booking-system|src/route|bookingRoute|bookingService|bookingController|IBooking"`

Risks:
- File/folder renames can break imports, compiled test paths, and workspace references.
- Root folder rename may affect local tooling paths and should be performed after source/docs are stable.
- The live root folder was not renamed inside this Codex session because the active workspace and writable root are still bound to `C:\Users\omarz\Desktop\Booking System`; renaming it externally to `Slotwise` remains the final manual workspace step.
- Remaining `Booking System` mentions should refer only to the current legacy workspace folder or historical context.
- Remaining `booking-system` mentions should only describe the pre-Phase 8 legacy package identity in historical context.

Completed mitigation:
1. Renamed one file or folder at a time and ran compile checks after each source rename group.
2. Updated compiled-output test import paths after source rename tasks.
3. Kept `/bookings` route behavior unchanged and covered by route tests.
4. Ran targeted searches for stale package/source paths after renames.
5. Left the root workspace folder rename as an external/manual workspace step because moving the active Codex root can invalidate the current terminal path and writable root.

## Phase 9: Architecture And Coding Standards
Status: Done

Purpose: Make Slotwise easier to grow by introducing clear engineering standards and a repository boundary between business logic and persistence.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 9.1 Add `.codex/instructions.md` | Documentation | Done | Low | No | Manual doc review |
| 9.2 Add `.codex/rules/code-standards.md` | Documentation | Done | Low | No | Manual doc review |
| 9.3 Add `.codex/rules/strict-resource-management.md` | Documentation | Done | Low | No | Manual doc review |
| 9.4 Introduce Repository Pattern | Architecture | Done | High | Yes | Compile and tests |
| 9.5 Improve comments, error boundaries, and return types | Refactor | Done | Medium | Yes | Compile and targeted review |

Architecture target:
- Controllers stay thin and handle HTTP request/response concerns.
- Services own business rules such as availability, email verification, and lifecycle transitions.
- Repositories own Mongoose access and persistence queries.
- Models define database shape only.
- Utilities remain pure or integration-focused helpers.

Verification:
- `.\node_modules\.bin\tsc.cmd` passed.
- `node --test tests\*.test.js` passed with 12 tests.
- `npm test` passed outside the sandbox after the sandboxed npm shim hit the known missing roaming `npm-cli.js` path.
- `rg -n "../models/booking.model|bookingModel|findByIdAndUpdate|findByIdAndDelete|findOne" src\services tests` found no remaining direct Mongoose model usage from the service/tests.
- No secrets are logged by the repository extraction.
- Booking service no longer directly depends on the Mongoose booking model after repository extraction.

Completed notes:
1. Added `.codex/instructions.md` as the Phase 9 Codex entrypoint for Slotwise-specific reading order, phase discipline, backend boundaries, and safe working rules.
2. Added `.codex/rules/code-standards.md` to define Slotwise backend layering, typing, error-handling, persistence, naming, testing, and change-discipline rules.
3. Added `.codex/rules/strict-resource-management.md` to define shared rules for database lifecycle, external API usage, request-response ownership, cleanup expectations, and test isolation.
4. Added `src/repositories/booking.repository.ts` and moved booking persistence access behind the repository boundary while preserving service behavior and `/bookings` compatibility.
5. Polished touched service methods with explicit public contracts and removed raw error-object concatenation from `getAllBookings`.

## Phase 10: Mandatory Platform Features
Status: Done

Purpose: Move Slotwise from basic CRUD toward a reliable booking platform.

Progress bar: `[########] 8/8 complete`

Checked:
- [x] 10.1 Full date-time availability logic
- [x] 10.2 Booking status lifecycle
- [x] 10.3 Admin approval/rejection endpoints
- [x] 10.4 Search and filtering
- [x] 10.5 Pagination and sorting
- [x] 10.6 Audit trail for status changes
- [x] 10.7 Request validation layer
- [x] 10.8 Standard response format

Currently under progress:
- None

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 10.1 Full date-time availability logic | Bug Fix | Done | Medium | Yes | Repository overlap query now uses `startDate`, `endDate`, `timein`, and `timeout`. |
| 10.2 Booking status lifecycle | Feature | Done | Medium | Yes | Added `cancelled` and `completed`, lifecycle transitions, and cancel/complete routes. |
| 10.3 Admin approval/rejection endpoints | Security | Done | High | Yes | Added owner/admin approval/rejection actions; later hardened to bearer-session auth in post-Phase 10 mitigation work. |
| 10.4 Search and filtering | Feature | Done | Medium | Yes | Added status, date range, email, phone, and customer name filters. |
| 10.5 Pagination and sorting | Performance | Done | Medium | Yes | Added `page`, `limit`, `sortBy`, and `sortOrder` support with metadata. |
| 10.6 Audit trail for status changes | Security | Done | High | Yes | Status changes now append audit entries with role, optional actor id, optional reason, and timestamp. |
| 10.7 Request validation layer | Architecture | Done | Medium | Yes | Added route-level body, id, and query validation. |
| 10.8 Standard response format | Architecture | Done | Medium | Yes | Added success/error envelopes for JSON responses. |

Verification:
- Compile and tests.
- Add focused tests per behavior.
- Keep existing `/bookings` compatibility unless a breaking migration is approved.

Completed notes:
1. Full availability checks now pass `startDate`, `endDate`, `timein`, and `timeout` to the repository overlap query.
2. Added preferred `PATCH /bookings/:id/approve` and `PATCH /bookings/:id/reject` endpoints.
3. Added legacy-compatible `PATCH /bookings/approve/:id` and `PATCH /bookings/reject/:id` endpoints.
4. Added a minimal owner/admin approval boundary first; later mitigation work replaced the header-only gate with bearer-session auth.
5. Full identity/session authentication remains a future hardening task; the current mitigation is role-gated authorization at the route boundary.
6. Verification passed with `.\node_modules\.bin\tsc.cmd`, `node --test tests\*.test.js`, and unsandboxed `npm test`.
7. Booking lifecycle now supports `pending`, `approved`, `rejected`, `cancelled`, and `completed`.
8. Added status-transition rules and owner/admin cancel/complete endpoints while preserving existing route compatibility.
9. Booking list reads now support filters for `status`, `startDateFrom`, `startDateTo`, `email`, `phone`, and `customerName`.
10. Booking list reads now support pagination and sorting with `page`, `limit`, `sortBy`, and `sortOrder`.
11. Added request validation middleware for booking create/update payloads, list queries, and route ids.
12. JSON responses now use `{ success, data, meta }` for success and `{ success, error }` for errors; delete keeps its `204` no-body contract.
13. Status changes now append `statusHistory` audit entries with `fromStatus`, `toStatus`, `changedAt`, `changedByRole`, optional `changedBy`, and optional `reason`.
14. Phase 10 verification passed with `.\node_modules\.bin\tsc.cmd`, `node --test tests\*.test.js`, and unsandboxed `npm test`.

## Phase 11: Professional Business Features
Status: Done

Progress bar: `[########] 8/8 complete`

Completed groundwork:
- [x] 11.0 Shared domain foundations
- [x] 11.0a Booking workflow integration foundation

Currently under progress:
- None

## Post-Phase 10 Carry-Forward Risk Mitigation
Status: Done

Purpose: Reduce the three known carry-forward risks left after Phase 10 without pulling Phase 11 work forward.

Progress bar: `[###] 3/3 complete`

Checked:
- [x] Harden privileged status-action authorization
- [x] Mitigate missing legacy `statusHistory`
- [x] Reduce regex-heavy booking text filters

Currently under progress:
- None

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| Harden privileged status-action authorization | Security | Done | High | Yes | Added shared-secret and actor-id checks for owner/admin status actions. |
| Mitigate missing legacy `statusHistory` | Data | Done | High | Yes | Legacy bookings now surface synthetic baseline history and future writes backfill persisted history when needed. |
| Reduce regex-heavy booking text filters | Performance | Done | Medium | Yes | Added normalized search fields, indexes, and one-time backfill for legacy records. |

Verification:
- `.\node_modules\.bin\tsc.cmd`
- Focused tests first, then full `node --test tests\*.test.js`
- Unsandboxed `npm test` after behavior changes if sandbox npm remains unhealthy

Completed notes:
1. Privileged status-action routes now require operator login through `/auth/session` and bearer sessions.
2. Legacy bookings with empty `statusHistory` now surface a synthetic baseline entry, and the next status change persists that baseline before the real transition.
3. Booking search now uses normalized indexed fields for email, phone, and customer-name prefixes.
4. An explicit `npm run backfill:bookings` command now backfills missing normalized search fields and legacy `statusHistory` entries.
5. The explicit backfill command is currently blocked by the configured MongoDB host refusing the connection from this machine.

Purpose: Make Slotwise adaptable across business types instead of tied to one booking scenario.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 11.0 Shared domain foundations | Architecture | Done | High | Yes | Added Phase 11 interfaces and Mongoose models for business profiles, service/resources, and customers. |
| 11.0a Booking workflow integration foundation | Architecture | Done | High | Yes | Bookings now support business/customer/resource links, scoped availability context, notification plans, and reschedule history metadata. |
| 11.1 Business profile model | Feature | Done | High | Yes | Added business profile models, repositories, services, controllers, routes, and validation. |
| 11.2 Service/resource model | Feature | Done | High | Yes | Added service/resource models plus CRUD-style management APIs for services, staff, rooms, tables, equipment, appointments, and events. |
| 11.3 Configurable availability rules | Feature | Done | High | Yes | Booking creation/update now enforces per-business and per-resource availability rules. |
| 11.4 Working hours and blackout dates | Feature | Done | High | Yes | Booking scheduling now checks configured working hours and blackout windows. |
| 11.5 Customer records | Feature | Done | Medium | Yes | Added reusable customer records, search filters, upsert support, and booking linkage. |
| 11.6 Notification planning | Feature | Done | Medium/High | Yes | Booking workflows now attach reminder/confirmation/cancellation/reschedule planning metadata without sending provider traffic. |
| 11.7 Cancellation and rescheduling | Feature | Done | Medium | Yes | Added staff reschedule flow plus lightweight customer cancel/reschedule flows. |
| 11.8 Role model | Security | Done | High | Yes | Added staff operator sessions, business-member roles, and customer-role audit/self-service flows. |

Verification:
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

Completed notes:
1. Added `src/interfaces/business.interface.ts`, `src/interfaces/service-resource.interface.ts`, and `src/interfaces/customer.interface.ts` as the shared Phase 11 domain contracts.
2. Added `src/models/business-profile.model.ts`, `src/models/service-resource.model.ts`, and `src/models/customer.model.ts` with validation, indexes, and serialization guards where appropriate.
3. Compile verification passed after adding the new Phase 11 domain foundations.
4. Extended booking data and service logic so business-scoped bookings can enforce advance notice, working hours, blackout windows, slot intervals, capacity, and scoped overlap checks.
5. Added customer upsert/count support, notification planning metadata, and reschedule-history metadata in the booking workflow foundation.
6. Added protected `/businesses`, `/service-resources`, and `/customers` management APIs with targeted validation and role gates.
7. Added staff operator authentication support plus staff booking reschedule routes and customer self-service cancel/reschedule routes.
8. Phase 11 verification passed with `.\node_modules\.bin\tsc.cmd` and `node --test tests\*.test.js` with 59 passing tests.

## Post-Phase 11 Modern Auth And Notification Hardening
Status: Done

Purpose: Resolve the three carried-forward risks left after Phase 11 using a modern backend architecture that fits the current Slotwise stack.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| H1 Persistent auth and notification foundations | Architecture | Done | High | Yes | Added DB models/interfaces for operator accounts, auth sessions, verification tokens, and notification jobs. |
| H2 Operator auth migration to DB sessions | Security | Done | High | Yes | `/auth/session` now uses Argon2-hashed operator accounts plus persistent MongoDB-backed sessions. |
| H3 Customer passwordless auth | Security | Done | High | Yes | Added customer magic-link request/verify flows, persistent customer sessions, and session-protected customer booking actions. |
| H4 Notification outbox delivery | Feature | Done | High | Yes | Added provider-backed email outbox processing with worker lifecycle, templates, retries, and booking/auth email queue execution. |

Verification:
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

Completed notes:
1. Added persistent auth and notification domain contracts for operator accounts, auth sessions, verification tokens, and notification jobs.
2. Added MongoDB TTL-backed models for auth sessions and verification tokens, plus indexed notification job storage for the future outbox worker.
3. Compile verification passed after the persistence foundations were added.
4. Replaced the in-memory operator session path with persistent operator-account lookup, Argon2 password verification, hashed opaque session tokens, TTL-backed auth sessions, and startup bootstrap seeding from env credentials.
5. Compile verification passed after the operator auth migration.
6. Added customer magic-link request and verification flows backed by persisted verification tokens and customer auth sessions.
7. Customer self-service booking cancellation and rescheduling now require authenticated customer sessions instead of booking-id-plus-email request bodies.
8. Compile verification passed after the customer passwordless auth migration.
9. Added outbox processing with template rendering, Resend/noop provider delivery, retries, payload scrubbing for magic links, and worker startup/shutdown wiring.
10. Post-Phase 11 hardening verification passed with `.\node_modules\.bin\tsc.cmd` and `node --test tests\*.test.js` with 63 passing tests.

## Phase 12: Creative Differentiator Features
Status: In Progress

Purpose: Add product ideas that make Slotwise feel more useful, polished, and memorable after the core platform is stable.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 12.1 Smart booking suggestions | Feature | Done | High | Yes | Added `POST /bookings/suggestions` with ranked nearby slot recommendations driven by existing availability rules. |
| 12.2 Conflict-risk indicators | Feature | Done | Medium | Yes | `conflictRisk` is now persisted, filterable, and enriched with urgency, stale approval, repeat reschedule, large-party, tight-turnaround, and heavy-load signals. |
| 12.3 Booking timeline view | UX/UI | Done | Medium | Yes | Added a backend timeline feed grouped by day with sorted bookings and per-day summary counts. |
| 12.4 No-show and cancellation insights | Feature | Done | Medium | Yes | Added explicit `no_show` lifecycle support plus `GET /bookings/insights/cancellation-no-show` analytics. |
| 12.5 Flexible business templates | Feature | Done | Medium | Yes | Added business template presets plus template-backed business-profile create/update and discovery endpoints. |
| 12.6 Embeddable booking widget plan | UX/UI | Done | High | Yes | Added persisted widget settings plus a public widget-config endpoint with active resource previews. |
| 12.7 Public booking page customization | UX/UI | Done | Medium | Yes | Added persisted public-page settings plus a public booking-page config endpoint by business slug. |
| 12.8 Analytics dashboard | Feature | Done | Medium | Yes | Added a backend dashboard insights endpoint with KPI, funnel, utilization, and peak-time aggregates. |

Verification:
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

Completed notes:
1. Implemented Phase 12.1 smart booking suggestions with `POST /bookings/suggestions`.
2. Suggestions reuse the existing availability engine and return ranked nearby alternatives based on slot proximity and current conflict-risk score.
3. Added targeted validation and regression coverage for the new suggestions route, controller, and booking-service behavior.
4. Implemented Phase 12.2 conflict-risk indicators as the first creative differentiator slice.
5. `conflictRisk` snapshots are now persisted on booking mutations and can be filtered through `GET /bookings?conflictRiskLevel=...`.
6. Risk scoring now combines current metadata signals with actionable operational context: tight turnaround windows and heavy same-day booking load.
7. Implemented Phase 12.4 with an explicit `no_show` lifecycle state for approved bookings and a cancellation/no-show insights endpoint.
8. Insights now summarize cancellation rate, no-show rate, service-delivery rate, reason breakdowns, and weekday patterns using persisted booking history.
9. Implemented Phase 12.5 flexible business templates with reusable presets for restaurant, clinic, salon, consulting, venue, rental, and fitness workflows.
10. Added `GET /businesses/templates` and `GET /businesses/templates/:templateKey`, plus optional `templateKey` support on business-profile create/update so presets can safely fill scheduling defaults while still allowing overrides.
11. Template presets currently provide business rules, working-hours defaults, notification defaults, and suggested resource blueprints; automatic resource seeding remains deferred.
12. Added focused regression coverage for low, medium, and high conflict-risk scenarios plus the new query/filter surface, no-show analytics flow, and business-template behavior.
13. Implemented Phase 12.6 as a backend-ready embeddable widget foundation with persisted `widgetSettings` on business profiles and template presets.
14. Added `GET /businesses/public/:slug/widget` so public consumers can bootstrap widget branding, copy, active resources, and booking endpoint hints by business slug.
15. Added focused regression coverage for widget-setting validation, public widget config responses, and slug validation.
16. Implemented Phase 12.7 as a backend-ready public booking page customization layer with persisted `publicPageSettings` on business profiles and template presets.
17. Added `GET /businesses/public/:slug/booking-page` so public consumers can fetch page-title, hero-copy, optional contact/work-hours visibility, active resource previews, and booking endpoint hints.
18. Added focused regression coverage for public-page setting validation, controller responses, route registration, and service-level visibility behavior.
19. Implemented Phase 12.3 as a backend-ready booking timeline feed without introducing frontend calendar code.
20. Added `GET /bookings/timeline` so operators can fetch day-grouped bookings with sorted timeline entries, duration metadata, reschedule flags, conflict-risk context, and per-day summary counts.
21. Added focused regression coverage for the timeline controller response, route registration, and service-level grouping/sorting behavior.
22. Implemented Phase 12.8 as a backend-ready analytics dashboard feed without introducing frontend dashboard code.
23. Added `GET /bookings/insights/dashboard` so operators can fetch KPI summaries, lifecycle funnel counts, weekday/resource utilization, and peak booking-hour aggregates.
24. Added focused regression coverage for dashboard route registration, controller response wiring, and service-level analytics aggregation behavior.

## Phase 13: Attractive Professional Frontend/UI/UX
Status: Done

Purpose: Define a serious, attractive, professional frontend direction before implementation starts.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 13.1 Add `UI_UX_DESIGN_BRIEF.md` | UX/UI | Done | Low | No | Manual doc review |
| 13.2 Define Slotwise brand direction | UX/UI | Done | Low | No | Expanded `UI_UX_DESIGN_BRIEF.md` with brand posture, palette direction, and visual principles. |
| 13.3 Plan admin dashboard | UX/UI | Done | Low | No | Expanded the brief with admin IA, screen priorities, and dashboard/timeline expectations. |
| 13.4 Plan customer portal | UX/UI | Done | Low | No | Expanded the brief with customer flow priorities and page structure expectations. |
| 13.5 Plan responsive layouts | UX/UI | Done | Low | No | Added explicit desktop, tablet, and mobile behavior guidance. |
| 13.6 Define design system | UX/UI | Done | Low | No | Added component, motion, color, and typography direction. |
| 13.7 Define accessibility requirements | UX/UI | Done | Low | No | Added concrete accessibility requirements for focus, forms, timeline, and state messaging. |
| 13.8 Deepen screen composition and interaction patterns | UX/UI | Done | Low | No | Expanded the brief with visual tokens, admin/customer interaction patterns, hosted-surface guidance, analytics direction, and content/copy rules. |
| 13.9 Add localization and internationalization guidance | UX/UI | Done | Low | No | Expanded the brief with locale-aware copy, formatting, layout-resilience, timezone, and RTL-readiness expectations. |
| 13.10 Add frontend gaps and operational UX standards | UX/UI | Done | Low | No | Expanded the brief with planning-gap checkpoints plus standards for loading, error handling, privacy, feedback, form resilience, and performance perception. |

Admin dashboard targets:
- Booking queue, status cards, calendar/timeline, filters/search, booking detail drawer/page, approve/reject/reschedule actions, customer profile view, and business settings.

Customer portal targets:
- Business/service selection, availability picker, customer details form, confirmation screen, booking status lookup, and reschedule/cancel request.

Design system targets:
- Colors, typography, spacing, buttons, forms, tables, badges, dialogs, empty states, loading states, error states, and success states.

Accessibility targets:
- Keyboard navigation, readable contrast, text labels for status, form error messages, and touch-friendly controls.

Verification:
- Manual review of `UI_UX_DESIGN_BRIEF.md`
- Targeted markdown sync across project docs

Completed notes:
1. Expanded `UI_UX_DESIGN_BRIEF.md` into the active Phase 13 frontend planning artifact for brand, admin, customer, responsive, design-system, and accessibility direction.
2. Defined Slotwise’s product character as calm, professional, and operationally trustworthy rather than marketing-heavy.
3. Added admin information architecture and screen-priority planning for dashboard, bookings, timeline, customers, resources, and settings.
4. Added customer experience priorities and page-structure guidance for public booking, confirmation, and booking-management flows.
5. Added design-system direction for status chips, tables, drawers, date/time controls, motion, and visual hierarchy.
6. Added explicit responsive behavior expectations for desktop, tablet, mobile admin, and mobile customer flows.
7. Added stronger accessibility requirements for focus visibility, reading order, screen-reader labeling, validation, and state messaging.
8. Deepened the brief with screen-composition guidance, interaction-pattern expectations, hosted booking-surface direction, analytics presentation rules, and product-copy principles so Phase 14 has a more opinionated UI/UX target.
9. Added localization and internationalization guidance so future frontend work accounts for translated copy, locale-aware formatting, timezone clarity, layout expansion, and RTL readiness from the start.
10. Added a frontend gap checklist and operational UX standards so the next frontend phase can close remaining planning holes around screen inventory, role-based UX, state coverage, API contract readiness, and design QA.

## Phase 14: Frontend Implementation Roadmap
Status: Done

Purpose: Preserve frontend implementation as a later architecture decision after UI/UX direction, auth, and platform APIs are clearer.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 14.1 Select frontend implementation direction | UX/UI | Done | Low | No | Manual roadmap review |
| 14.2 Add frontend approval/fix process before scaffolding | Documentation | Done | Low | No | Targeted roadmap sync check |
| 14.3 Resolve approved pre-scaffold decisions and remaining risks | Documentation | Done | Medium | Approved by user | Targeted risk sync check |
| 14.4 Run implementation-time frontend package/security review | Audit | Done | Medium | Approved by user | `npm view` package metadata |
| 14.5 Scaffold isolated frontend workspace | UX/UI | Done | Medium | Approved by user | Frontend install, build, tests, audit, HTTP smoke |

Planned app features:
- Admin web app.
- Customer booking portal.
- Reusable design system/components.
- API client layer.
- Auth-aware layouts after auth is designed.
- Dashboard analytics views.
- Calendar and timeline views.
- Booking form and validation UX.
- Professional loading, empty, success, and error states.

Selected implementation direction:
- Create a future separate `frontend/` TypeScript SPA when implementation is approved.
- Use React with Vite as the planned app foundation.
- Use React Router for SPA/data routing.
- Use TanStack Query for server-state reads, mutations, cache invalidation, loading states, and query lifecycle handling.
- Use design-token-first CSS, likely with Tailwind CSS as the utility layer, plus accessible headless primitives only where they reduce custom interaction risk.
- Build Slotwise-specific admin, customer, and widget components instead of adopting a heavy pre-styled admin template.

Planning artifact:
- `FRONTEND_IMPLEMENTATION_ROADMAP.md`

Implementation sequence:
1. Approve frontend architecture and package adoption before adding `frontend/`.
2. Scaffold the frontend workspace and baseline scripts.
3. Add API client and typed response envelopes.
4. Build auth/session screens and route guards after a security review of token storage.
5. Build admin shell, dashboard, booking queue, timeline, detail drawer, customers, resources, and settings.
6. Build public booking page from public business-page config.
7. Build embeddable widget from public widget config.
8. Add responsive, accessibility, localization, and browser QA checks.

Approved pre-scaffold decisions:
- Architecture/package direction is approved for a future separate `frontend/` TypeScript SPA with React, Vite, React Router, TanStack Query, Tailwind CSS, and Slotwise-owned components.
- Candidate package categories are approved for implementation-time review: runtime, routing, server-state, styling, accessible primitives, forms, schema validation, date/time utilities, charts, icons, tests, browser QA, and accessibility checks.
- Token/session storage baseline is in-memory bearer-token storage only for the first slice; no `localStorage` for operator or customer session tokens.
- Deployment baseline is a separately built static SPA with an environment-specific API base URL.
- SSR/pre-rendering is deferred for the first implementation slice.
- Widget style isolation baseline is iframe-based embed isolation for third-party hosts.

Verification:
- Manual review of `FRONTEND_IMPLEMENTATION_ROADMAP.md`.
- Targeted markdown sync across Phase 14 references.
- `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install` in `frontend/` passed with 0 vulnerabilities.
- `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build` in `frontend/` passed.
- `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run test:run` in `frontend/` passed with 2 tests.
- `node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" audit --audit-level=moderate` in `frontend/` passed with 0 vulnerabilities.
- Same-shell Vite HTTP smoke check returned `200` for `/` and `/src/main.tsx`.
- In-app browser QA was attempted twice but blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.

Completed notes:
1. Added `FRONTEND_IMPLEMENTATION_ROADMAP.md` as the Phase 14 planning/selection artifact.
2. Selected a future React + Vite + React Router + TanStack Query direction for the frontend without adding packages or source code.
3. Documented the needed admin, customer, public booking-page, and widget screens.
4. Documented required components, API dependencies, state rules, localization/accessibility expectations, and future verification.
5. Kept frontend implementation, package installation, auth storage, deployment topology, SSR, and widget style-isolation decisions deferred until explicit approval.
6. Added an approval and fix process requiring architecture/package approval, package/security review, token/session storage review, deployment confirmation, SSR/pre-rendering decision, and widget style-isolation selection before scaffolding `frontend/`.
7. Recorded user approval for the pre-scaffold decisions and resolved the planning risks into explicit baselines: approved candidate package set, memory-only token storage, static SPA deployment, deferred SSR/pre-rendering, and iframe-based widget isolation.
8. Remaining risk is implementation-time only: package security/version review, API DTO drift, static hosting/CORS details, and the re-authentication tradeoff from memory-only tokens.
9. Completed the implementation-time npm metadata review for the first frontend package set on June 13, 2026.
10. Created the isolated `frontend/` Vite + React + TypeScript scaffold with an operational admin dashboard shell, API envelope client foundation, memory-only session store, Tailwind-powered styling, and smoke tests.
11. Verified frontend install/build/tests/audit and local Vite HTTP serving; visual in-app browser QA remains blocked by the current Windows sandbox.

## Phase 15: Dependency Audit And Modernization
Status: Done

Purpose: Keep Slotwise secure, current, and professionally maintained by auditing dependencies, fixing vulnerabilities, upgrading packages, and introducing modern packages only when they clearly improve the platform.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 15.1 Repair npm runtime if still broken | DevOps | Done | Medium | Yes | Normal unsandboxed npm works at `11.16.0`; the remaining failure is the Codex PowerShell/sandbox shim selecting the roaming npm prefix. |
| 15.2 Run dependency inventory | Audit | Done | Medium | Yes | `npm ls --depth=0` succeeds through `C:\Program Files\nodejs\npm.cmd`; direct packages match the manifest. |
| 15.3 Run security audit | Security | Done | Medium | Yes | `npm audit --audit-level=moderate` succeeds through normal unsandboxed npm. |
| 15.4 Run safe audit fix | Security | Done | Medium | Yes | Approved non-force `npm audit fix` updated `form-data` to `4.0.6` and cleared vulnerabilities to 0. |
| 15.5 Review force fixes separately | Security | Done | High | Yes | No distinct `npm audit fix --force` pass is needed after the June 16, 2026 non-force audit repair. |
| 15.6 Check outdated packages | Audit | Done | Medium | Yes | `npm outdated` currently reports only compatible `axios` `1.17.0` -> `1.18.0`; no force audit action is indicated. |
| 15.7 Update compatible packages | DevOps | Done | Medium | Yes | `npm update`, compile, tests |
| 15.8 Upgrade major versions with migration notes | Refactor | Done | High | Yes | `dotenv` 17, `express` 5, and `mongoose` 9 applied with targeted compatibility fixes |
| 15.9 Remove obsolete packages | DevOps | Done | Medium | Yes | Deprecated `@types/mongoose` removed; compile/tests passed |
| 15.10 Add required modern backend packages | Feature | Deferred | Medium/High | Yes | No concrete backend package gap was proven in this closure pass. |
| 15.11 Retire stale deferred frontend-packages note after scaffold | Documentation | Done | Low | No | Frontend roadmap/docs synced to the existing `frontend/` workspace |
| 15.12 Document dependency decisions | Documentation | Done | Low | No | README, SYSTEM_MAP, CHANGELOG, audit docs updated |

Required commands:
- `npm --version`
- `npm ls --depth=0`
- `npm audit`
- `npm audit fix`
- `npm outdated`
- `npm update`
- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

Safety rules:
- Do not run `npm audit fix --force` without a high-reasoning review and explicit approval.
- Do not add packages just because they are popular; each package needs a purpose, maintenance check, security check, and implementation plan.
- Prefer package-specific migration notes for major upgrades.
- After every package change, update `package.json`, `package-lock.json`, `SYSTEM_MAP.md`, `README.md`, `CHANGELOG.md`, and this progress table.
- Keep dependency updates small: security fix first, compatible updates second, major migrations third, new packages last.
- Verify latest package versions at implementation time with npm registry commands such as `npm view <package> version`; do not rely on stale remembered versions.

Current packages to audit:
- Runtime: `axios`, `dotenv`, `express`, `libphonenumber-js`, `mongoose`, `validator`.
- Development: `@types/express`, `@types/mongoose`, `@types/validator`, `nodemon`, `ts-node`.

Modern package candidates to evaluate:
- Security middleware: `helmet`, `cors`, `express-rate-limit`.
- Validation and DTO contracts: `zod` or another actively maintained schema validator.
- Logging: `pino` with HTTP logging middleware if structured logs are needed.
- Testing/API checks: `supertest` if route tests need real request/response coverage.
- API documentation: `swagger-ui-express` and OpenAPI tooling if public API docs become required.
- Config validation: schema-based environment validation if current env helper becomes too limited.
- Frontend later: modern frontend framework, UI library, data-fetching client, form validation, calendar/date picker, charting, and design-system tooling after Phase 14 decisions.

Upgrade implementation notes:
- Express major upgrades must check route behavior, middleware behavior, error handling, and test compatibility.
- Mongoose major upgrades must check schema validation, query return types, model typing, and connection behavior.
- Axios updates must check Hunter API response handling and error shapes.
- Validator/libphonenumber updates must rerun all validation tests and add regression tests for accepted phone/email examples.
- Type package changes must be reviewed because some packages ship their own types and may no longer need `@types/*`.

Risks:
- Dependency upgrades can introduce breaking API, typing, or runtime behavior changes.
- Security fixes may require major-version upgrades.
- Adding new packages can increase maintenance, bundle size, attack surface, and migration burden.
- Normal unsandboxed npm is healthy on this machine; only the Codex PowerShell/sandbox path remains flaky.

Prepared next cleanup batch:
1. Machine/runtime closure docs now group the sandbox npm shim, the current Node `v26.3.0` non-LTS runtime note, and the explicitly deferred lint/format/CI baseline.
2. `15.5` was reviewed separately on June 16, 2026; the evidence supported approved non-force `npm audit fix`, not `npm audit fix --force`.
3. `15.10` remains deferred until a concrete backend gap proves that a new package is required.
4. Closure success means the docs stay consistent, the operational npm shim gap is documented with exact scope, and no new backend package work is mixed into machine/runtime cleanup by accident.

Current npm execution note:
- On June 16, 2026, the Codex sandbox sees `node --version` as `v26.3.0` from `C:\Program Files\nodejs\node.exe`.
- On June 16, 2026, unsandboxed `npm --version` works and reports `11.16.0`; `where.exe npm` returns `C:\Program Files\nodejs\npm`, `C:\Program Files\nodejs\npm.cmd`, `C:\Users\omarz\AppData\Roaming\npm\npm`, and `C:\Users\omarz\AppData\Roaming\npm\npm.cmd`.
- In the Codex PowerShell/sandbox path, bare `npm --version` still fails because `C:\Program Files\nodejs\npm.ps1` asks `npm-prefix.js` for the prefix, receives `C:\Users\omarz\AppData\Roaming\npm`, and then selects `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`, which the sandbox cannot read/execute.
- Safe workaround inside Codex is `C:\Program Files\nodejs\npm.cmd` or the bundled CLI `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`; this is not a general unsandboxed npm failure.
- Official Node release metadata checked on June 16, 2026 lists `v24.16.0` as Latest LTS, `v26.3.0` as Latest Release/Current, and the v23 line as EOL. The older `v23.6.0` note is no longer the current machine state.
- Moving this machine from current `v26.3.0` to LTS `v24.16.0` remains a machine-level installer/uninstall task; the previous official MSI attempt failed with Windows Installer error `1730` because administrator rights were required to remove the existing machine-wide Node installation.

Current manifest-based inventory:
- Final runtime: `axios@1.17.0`, `dotenv@17.4.2`, `express@5.2.1`, `libphonenumber-js@1.13.6`, `mongoose@9.7.0`, `validator@13.15.35`
- Final development: `@types/express@5.0.6`, `@types/validator@13.15.10`, `nodemon@3.1.14`, `ts-node@10.9.2`
- Obsolete package removed: `@types/mongoose`

Audit findings snapshot:
- Initial `npm audit` reported 17 vulnerabilities: 4 low, 3 moderate, 8 high, 2 critical.
- Direct dependency vulnerabilities affect `axios`, `express`, `mongoose`, and `validator`.
- Transitive vulnerability clusters include `body-parser`, `cookie`, `path-to-regexp`, `qs`, `send`, `serve-static`, `follow-redirects`, `form-data`, `brace-expansion`, `braces`, `diff`, `minimatch`, and `picomatch`.
- The approved June 16, 2026 non-force `npm audit fix` updated the vulnerable `form-data` path to `4.0.6`; a follow-up audit reported 0 vulnerabilities.

Outdated snapshot:
- Compatible updates were applied through `npm update`.
- Obsolete package cleanup completed: deprecated `@types/mongoose` was removed successfully.
- `dotenv` was upgraded to `17.4.2`; `src/config/env.ts` now sets `DOTENV_CONFIG_QUIET` and passes `quiet: true` to preserve quiet startup/test behavior.
- `express` was upgraded to `5.2.1` with `@types/express` `5.0.6`; `src/controllers/booking.controller.ts` now uses typed route params for Express 5 compatibility.
- `mongoose` was upgraded to `9.7.0`; `src/utils/validators.ts` now uses a minimal local cast inside `endDateValidator`, and `src/interfaces/booking.interface.ts` keeps `_id` as a required `mongoose.Types.ObjectId` for current Mongoose typing.
- Final project dependency state: `npm outdated` reports a compatible `axios` update from `1.17.0` to `1.18.0`; this is not an audit-force blocker and can be handled in a normal compatible-update pass.

## Phase 16: Frontend/Backend Feature Alignment
Status: In progress

Purpose: Turn the current frontend scaffold into a complete product frontend that matches the implemented backend feature surface for the admin/operator app, customer portal, public booking page, and iframe-first widget foundation.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 16.1 Create frontend-backend coverage matrix | Documentation / Audit | Done | Low | User approved Phase 16 renumber | Manual matrix review |
| 16.2 Add frontend route map and app shell routing | UX/UI | Done | Medium | User switched to 5.5 medium | Frontend build/tests |
| 16.3 Add shared API client modules and DTOs | Architecture | Done | Medium | User approved proceed on 5.5 medium | Typecheck/tests |
| 16.4 Add operator auth screens and memory-session flow | Security / UX/UI | Done | High | User approved high reasoning | Auth tests/build |
| 16.5 Add bookings list with filters, sorting, pagination | Feature / UX/UI | Done | Medium | User approved proceed | Frontend tests/build |
| 16.6 Add booking detail drawer/page | Feature / UX/UI | Done | Medium | User approved moving on | Frontend tests/build |
| 16.7 Add booking lifecycle actions | Security / UX/UI | Done | High | User approved high reasoning | Frontend tests/typecheck/build/HTTP smoke |
| 16.8 Add booking reschedule and suggestion flows | Feature / UX/UI | Done | Medium/High | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.9 Add timeline/calendar frontend view | UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.10 Add dashboard analytics views | UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.11 Add cancellation/no-show insights views | UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.12 Add business profile/settings screens | Feature / UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.13 Add service/resource management screens | Feature / UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.14 Add customer management screens | Feature / UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.15 Add business template selection UI | UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.16 Add public booking page flow | UX/UI | Done | Medium/High | User approved medium/high | Frontend tests/typecheck/build/HTTP smoke/browser QA attempt |
| 16.17 Add customer magic-link and booking management flow | Security / UX/UI | Done | High | User approved high reasoning | Frontend tests/typecheck/build/HTTP smoke/browser QA attempt |
| 16.18 Add embeddable widget frontend foundation | UX/UI | Done | Medium/High | User approved implementation | Frontend tests/typecheck/build/HTTP smoke/browser QA attempt |
| 16.19 Add global loading, empty, error, success states | UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke |
| 16.20 Add responsive and accessibility QA pass | Test / UX/UI | Done | Medium | User approved implementation | Frontend tests/typecheck/build/HTTP smoke/browser QA attempt |
| 16.21 Public-surface hardening pass | UX/UI / Hardening | Done | Medium/High | User confirmed separate approval | Frontend tests/typecheck/build/HTTP smoke |
| 16.22 Persist bookings list state in URL search params | UX/UI / Hardening | Done | Medium | User approved | Frontend tests/typecheck/build/HTTP smoke |
| 16.23 Add browser-local saved views for `/admin/bookings` | UX/UI / Hardening | Done | Medium | User approved | Frontend tests/typecheck/build/HTTP smoke |
| 16.24 Add removable active filter chips and clear-all for `/admin/bookings` | UX/UI / Hardening | Done | Medium | User approved | Frontend tests/typecheck/build/HTTP smoke |
| 16.25 Session hardening and current-session revalidation for operator/customer flows | Security / Hardening | Done | High | User approved narrow scope | Frontend tests/typecheck/build/HTTP smoke |
| 16.26 Add working-hours and blackout editors in `/admin/settings` | Feature / UX/UI | Done | Medium | User approved grouped admin-management slice | Frontend tests/typecheck/build/backend tests/build attempted/HTTP smoke attempted |
| 16.27 Add resource edit drawers and availability overrides in `/admin/resources` | Feature / UX/UI | Done | Medium | User approved grouped admin-management slice | Frontend tests/typecheck/build/backend tests/build attempted/HTTP smoke attempted |
| 16.28 Add customer create and edit flows in `/admin/customers` | Feature / UX/UI | Done | Medium | User approved grouped admin-management slice | Frontend tests/typecheck/build/backend tests/build attempted/HTTP smoke attempted |

Frontend-backend coverage matrix:
| Backend capability | Route/API surface | Current frontend coverage | Phase 16 target |
|---|---|---|---|
| Operator session auth | `POST /auth/session`, `GET /auth/session`, `DELETE /auth/session` | `/login` plus protected admin routes now keep tokens memory-only, revalidate real current sessions on entry/focus, refresh in-memory session metadata from the backend, and fail closed with an expiry notice when the server rejects the token | Future hardening can add cookie-based persistence only after separate approval |
| Customer magic-link auth | `POST /auth/customer/magic-link`, `POST /auth/customer/verify` | `/portal` now renders customer magic-link request, token entry/auto-verify, isolated memory-only customer session state, and current-session revalidation with expiry messaging on entry/focus without persistent storage | Future hardening can add cookie-backed persistence only after separate approval |
| Booking list and search | `GET /bookings` with filters, pagination, sorting | `/admin/bookings` now renders a TanStack Query-backed bookings list with customer search, status/risk filters, sorting, pagination controls, responsive table/list layout, URL-persistent search params, browser-local saved views, and lightweight removable active-filter chips with clear-all reset for quick workspace cleanup on the same device | Future hardening can add cross-device saved-view sync only after approval |
| Booking detail | `GET /bookings/:id` | `/admin/bookings` opens a detail drawer backed by `GET /bookings/:id`, showing customer contact, schedule, metadata IDs, notes, conflict-risk summary/signals, status history, lifecycle controls, and operator rescheduling | Future hardening can add deeper audit reason capture after approval |
| Booking lifecycle | approve, reject, cancel, complete, no-show routes | Detail drawer exposes role-aware approve/reject/cancel/complete/no-show actions with confirmation prompts, mutation states, and query invalidation, while `/portal` now exposes customer cancellation over the existing authenticated customer route | Future lifecycle work can add deeper reason capture or audit drilldowns after approval |
| Booking reschedule | `PATCH /bookings/:id/reschedule` | Detail drawer exposes an operator-only pending/approved reschedule form with datetime fields, optional reason, confirmation, mutation states, and query refresh, while `/portal` now exposes customer reschedule requests over the existing authenticated customer route | Future hardening can add suggestion-assisted customer reschedule help or stricter slot validation polish after approval |
| Booking suggestions | `POST /bookings/suggestions` | Detail drawer can request nearby slot suggestions from the reschedule form and apply a suggested slot to the draft schedule | Future create-flow suggestion integration remains deferred |
| Timeline feed | `GET /bookings/timeline` | `/admin/timeline` now renders a query-backed timeline with date/status/resource filters, summary metrics, day-grouped entries, risk markers, status chips, and reschedule badges | Future hardening can add richer calendar lane interactions |
| Dashboard analytics | `GET /bookings/insights/dashboard` | `/admin` now renders query-backed KPI cards, lifecycle funnel bars, weekday/resource utilization, peak-time panels, and dashboard filters | Future hardening can add richer chart interactions |
| Cancellation/no-show insights | `GET /bookings/insights/cancellation-no-show` | `/admin` now renders cancellation/no-show summary cards, weekday trend bars, and reason summaries with the existing dashboard filters | Future hardening can add richer drilldowns after approval |
| Business profiles | `/businesses` | `/admin/settings` now renders query-backed business selection, editable profile basics, working-hour and blackout-date editors, save mutation states, operating-readiness summaries, and a read-only template preview area | Future hardening can add notification/widget/public-page editors after approval |
| Business templates | `GET /businesses/templates`, `GET /businesses/templates/:templateKey` | `/admin/settings` now renders a template gallery and read-only template preview using existing template routes without seeding resources | Future hardening can add explicit template-apply flows after approval |
| Service/resources | `/service-resources` | `/admin/resources` now renders query-backed filters, a resource list, create form, active/inactive toggle mutations, edit drawers, and availability override editing over the existing resource PATCH contract | Future hardening can add explicit nested-override clearing once the backend PATCH contract supports it |
| Customers | `/customers` | `/admin/customers` now renders query-backed customer filters, directory rows, booking-history entry points, and create/edit forms over existing customer create/update APIs | Future hardening can add richer relationship/history drilldowns after approval |
| Public booking page config | `GET /businesses/public/:slug/booking-page`, `POST /bookings/suggestions`, `POST /bookings` | `/book/:slug` now renders a branded public booking flow with resource/service selection, date/time inputs, customer details, party-size/notes support, suggestions, submit, success/error/loading/empty states, responsive public layout, explicit client-side validation, safer single-resource defaults, and portal handoff links that carry booking context | Future hardening can add deeper review/slot guidance or broader public-surface feature expansion only after separate approval |
| Widget config | `GET /businesses/public/:slug/widget` | `/widget/:slug` now renders a compact iframe-first booking flow with isolated styling, widget-config branding, service/resource selection, date/time and customer inputs, nearby suggestions, submit feedback, loading/error/empty/success states, stronger validation polish, compact/mobile layout cleanup, and richer `/book/:slug` plus `/portal` handoff links with preserved booking context | Future hardening can add richer embed sizing guidance or trusted first-party variants only after separate approval |

Design and engineering guardrails:
- Keep frontend implementation inside `frontend/`.
- Use React, Vite, TypeScript, React Router, TanStack Query, Tailwind CSS, Vitest, and the already-approved packages only.
- Do not add packages unless a missing capability cannot reasonably be built with the approved stack and package review is approved first.
- Prefer reusable screen, layout, form, status, state, and data-display components instead of one-off UI.
- Keep UI modern, minimalist, operationally dense where appropriate, fully responsive across mobile, tablet, and desktop, and aligned with `UI_UX_DESIGN_BRIEF.md`.
- Keep API behavior unchanged unless a backend gap is found and separately approved.
- Preserve memory-only token storage until a high-reasoning auth/session review approves another storage model.

Completed notes:
1. Renumbered the new frontend/backend alignment phase as Phase 16 to avoid colliding with the completed dependency modernization Phase 15.
2. Created the first frontend-backend coverage matrix, showing current scaffold coverage versus the backend feature surface.
3. Confirmed low reasoning is sufficient only for Phase 16 documentation/audit work; implementation tasks require medium, and auth/security tasks require high approval.
4. Added a central frontend route map, real React Router shell routing, admin navigation links, public-surface links, and responsive route placeholders for admin, customer portal, public booking page, and widget surfaces.
5. Kept Phase 16.2 free of auth guards, token-storage changes, backend API behavior changes, and new packages.
6. Added shared frontend DTOs and endpoint modules for auth, bookings, businesses, service/resources, customers, public booking page config, and public widget config.
7. Improved the shared API client with query serialization, JSON body handling, bearer-token headers, and `204` no-content handling while preserving the backend response envelope contract.
8. Added operator login UI at `/login`, protected admin routing, memory-only session metadata, and shell logout behavior without adding persistent token storage.
9. Kept public booking, widget, and customer portal routes outside the operator guard.
10. Added the Phase 16.16 customer-facing `/book/:slug` flow using existing public booking-page config, booking suggestion, and booking creation API clients/routes only.
11. Kept Phase 16.16 free of backend API changes, package additions, customer magic-link/customer portal flow, widget foundation, persistent token storage, and automatic template resource seeding.
12. Added a query-backed `/admin/bookings` screen with customer search, status/risk filters, sort controls, pagination controls, loading/error/empty states, and responsive booking records.
13. Added a read-only booking detail drawer backed by `GET /bookings/:id` with customer contact, schedule, notes, conflict-risk signals, operational IDs, and status history.
14. Added role-aware lifecycle controls in the booking detail drawer for approve, reject, cancel, complete, and no-show transitions, with confirmation prompts, mutation pending/error handling, and booking query refresh.
15. Added operator reschedule and nearby suggestion flows to the booking detail drawer for pending/approved bookings, using existing reschedule and suggestions routes with confirmation, pending/error states, and query refresh.
16. Added a query-backed `/admin/timeline` view using `GET /bookings/timeline`, with date/status/resource filters, summary metrics, day-grouped entries, conflict-risk markers, status chips, reschedule badges, and loading/error/empty states.
17. Replaced the static `/admin` dashboard examples with query-backed dashboard analytics using `GET /bookings/insights/dashboard`, including KPI cards, lifecycle funnel bars, weekday/resource utilization, peak-time panels, filters, and loading/error/empty states.
18. Added cancellation/no-show insight coverage to `/admin` using `GET /bookings/insights/cancellation-no-show`, with summary cards, weekday trend bars, reason summaries, dashboard filters, loading/error states, and typed DTO coverage.
19. Replaced the `/admin/settings` placeholder with a query-backed business settings screen over `/businesses`, including business selection, editable profile basics, working-hours and blackout-date editors, save mutation states, and an operating-readiness summary for template, rules, working hours, widget, and public-page posture.
20. Replaced the `/admin/resources` placeholder with a query-backed service/resource management screen over `/service-resources`, including business/type/active filters, resource list states, create form, active/inactive toggle mutation states, edit drawers, and availability override editing.
21. Replaced the `/admin/customers` placeholder with a query-backed customer management screen over `/customers`, including filters, directory rows, profile details, booking-history entry points, and create/edit flows using the existing customer create/update routes.
22. Added shared loading and inline success/error state helpers for touched admin screens.
23. Completed a responsive and accessibility QA pass across `/admin`, `/admin/bookings`, `/admin/timeline`, `/admin/customers`, `/admin/resources`, and `/admin/settings`, tightening keyboard focus states, live loading/error/success messaging, selected/pressed states, dialog semantics, long-text wrapping, mobile grids, filter controls, and row/card overflow without adding packages, backend API changes, or new product flows.
24. Added the Phase 16.17 customer-facing `/portal` flow using the existing customer magic-link request/verify routes plus current booking list and customer action APIs only, without backend changes, new packages, or persistent token storage.
25. Split frontend in-memory auth state so customer portal sessions stay isolated from the existing operator/admin memory session behavior.
26. Added lightweight `/book/:slug` to `/portal` integration links so existing customers can request or use a management magic link after or alongside public booking flows.
27. Added the Phase 16.18 customer-facing `/widget/:slug` flow using the existing public widget config, booking suggestion, and booking creation API clients/routes only, with iframe-first isolated styling, compact responsive layout, and lightweight `/book/:slug` plus `/portal` handoff links.
28. Updated shell surface navigation so parameterized public preview links resolve to concrete demo paths instead of literal `:slug` placeholders.
29. Kept persistent token storage, backend API changes, new packages, and automatic template resource seeding deferred to later approved slices.
30. Completed the approved Phase 16.21 public-surface hardening pass across `/book/:slug`, `/widget/:slug`, and `/portal` without backend API changes, new packages, persistent token storage, or product-scope expansion.
31. Added shared client-side validation helpers for public booking, widget, and portal flows so date/time ordering, basic contact inputs, party size, and token/business-id checks fail with explicit inline messaging instead of relying on browser defaults alone.
32. Tightened public-surface state transitions by resetting stale mutation banners when users edit their request, preserving portal reschedule success on same-booking refresh, and narrowing portal auto-verify to URL-provided tokens only.
33. Improved safer defaults and cross-surface handoffs by auto-selecting lone public resources, clamping party size to visible capacity, carrying booking/query context from widget to booking page and portal, and surfacing booking references after public submissions.
34. Added compact/mobile polish for portal booking rows, portal action buttons, and widget handoff links while keeping the slice limited to existing public surfaces.
35. Completed the approved Phase 16.22 `/admin/bookings` hardening slice by hydrating customer/status/risk/sort/page state from URL search params, resetting pagination when filters change, omitting default params from clean URLs, and covering the new reload/shareable behavior with frontend tests only.
36. Completed the approved Phase 16.23 `/admin/bookings` hardening slice by adding browser-local saved views for the existing list URL state, including lightweight save/apply/remove controls, active-view highlighting, and frontend-only persistence without backend or token-storage changes.
37. Completed the approved Phase 16.24 `/admin/bookings` hardening slice by adding lightweight removable active-filter chips for the existing customer/status/risk/sort/page state plus a clear-all reset back to the default clean URL, while keeping saved views, existing list controls, and backend APIs unchanged.
37. Completed the approved Phase 16.25 session-hardening slice without backend API or storage-model changes by adding current-session revalidation for real operator and customer sessions on route entry plus window focus/visibility return.
38. Added explicit expiry handling so invalid operator sessions redirect back to `/login` with a clear notice and invalid customer portal sessions fall back to fresh magic-link access messaging instead of leaving stale in-memory state active.
39. Preserved the existing memory-only token posture, separate operator/customer stores, and lightweight helper/demo sessions while refreshing server-backed session metadata in place when revalidation succeeds.

Verification:
- Manual documentation review for the Phase 16 matrix and numbering.
- `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 4 tests.
- `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Local HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin` when Vite stayed up.
- In-app browser QA remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.3 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 9 tests.
- Phase 16.3 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.3 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.4 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 11 tests.
- Phase 16.4 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.4 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.5 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 12 tests.
- Phase 16.5 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.5 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.5 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin/bookings`.
- Phase 16.5 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.6 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 13 tests.
- Phase 16.6 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.6 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.6 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin/bookings`.
- Phase 16.6 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.7 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 15 tests.
- Phase 16.7 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.7 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.7 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin/bookings`.
- Phase 16.7 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.8 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 16 tests.
- Phase 16.8 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.8 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.8 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin/bookings`.
- Phase 16.8 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.9 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 17 tests.
- Phase 16.9 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.9 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.9 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin/timeline`.
- Phase 16.9 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.10 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 17 tests.
- Phase 16.10 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.10 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.10 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5173/admin`.
- Phase 16.10 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.11-16.13 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 19 tests.
- Phase 16.11-16.13 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.11-16.13 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.11-16.13 verification: same-shell Vite HTTP smoke checks returned `200` for `http://127.0.0.1:5173/admin`, `http://127.0.0.1:5173/admin/settings`, and `http://127.0.0.1:5173/admin/resources`.
- Phase 16.11-16.13 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.14-16.15 and 16.19 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 20 tests.
- Phase 16.14-16.15 and 16.19 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.14-16.15 and 16.19 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.14-16.15 and 16.19 verification: same-shell Vite HTTP smoke checks returned `200` for `http://127.0.0.1:5173/admin/customers`, `http://127.0.0.1:5173/admin/settings`, and `http://127.0.0.1:5173/admin/bookings`.
- Phase 16.14-16.15 and 16.19 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.20 verification: sandboxed bare `npm run test:run` was blocked because the PowerShell npm shim selected `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js` under Node `v26.3.0`; local project binaries were used instead.
- Phase 16.20 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 20 tests.
- Phase 16.20 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.20 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.20 verification: same-shell Vite HTTP smoke checks returned `200` for `http://127.0.0.1:5173/admin`, `http://127.0.0.1:5173/admin/bookings`, `http://127.0.0.1:5173/admin/timeline`, `http://127.0.0.1:5173/admin/customers`, `http://127.0.0.1:5173/admin/resources`, and `http://127.0.0.1:5173/admin/settings`.
- Phase 16.26-16.28 verification: `frontend/node_modules/.bin/vitest.cmd run` passed with 36 tests, `frontend/node_modules/.bin/tsc.cmd -b` passed, `frontend` production build passed via local `tsc -b` + `vite build`, and backend `node --test tests/*.test.js` passed with 92 tests. A lightweight local Vite preview HTTP smoke attempt for `/admin/settings`, `/admin/resources`, and `/admin/customers` was made but the preview server refused connections in this Windows sandbox, so browser/route smoke remains unconfirmed here. Root `tsc` still fails because the repo-level `tsconfig` includes `frontend/**` outside its configured `rootDir`, which predates this slice.
- Phase 16.20 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.16 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 22 tests.
- Phase 16.16 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.16 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.16 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:5175/book/demo-business`.
- Phase 16.16 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.17 verification: sandboxed bare `npm` was blocked because the PowerShell npm shim selected `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js` under Node `v26.3.0`; local project binaries were used instead.
- Phase 16.17 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 24 tests.
- Phase 16.17 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.17 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.17 verification: same-shell Vite HTTP smoke check returned `200` for `http://127.0.0.1:4173/portal?businessId=507f1f77bcf86cd799439011&email=maya@example.com`.
- Phase 16.17 browser QA was attempted but remains blocked by the Windows sandbox browser runtime error `CreateProcessAsUserW failed: 5`.
- Phase 16.18 verification: sandboxed bare `npm` remained blocked because the PowerShell npm shim selected `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js` under Node `v26.3.0`; local project binaries were used instead.
- Phase 16.18 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 25 tests.
- Phase 16.18 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.18 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.18 verification: same-shell Vite preview HTTP smoke check returned `200` for `http://127.0.0.1:4176/widget/demo-widget`.
- Phase 16.18 browser QA was not retried because the known Windows sandbox browser runtime blocker `CreateProcessAsUserW failed: 5` remains unresolved at the environment level.
- Phase 16.21 verification: sandboxed bare `npm` remained blocked because the PowerShell npm shim selected `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js` under Node `v26.3.0`; local project binaries were used instead.
- Phase 16.21 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 27 tests.
- Phase 16.21 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.21 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.21 verification: same-shell Vite preview HTTP smoke checks returned `200` for `http://127.0.0.1:4176/book/demo-business`, `http://127.0.0.1:4176/widget/demo-widget`, and `http://127.0.0.1:4176/portal`.
- Phase 16.21 browser/in-app smoke was not retried because the known Codex Windows sandbox/runtime blocker `CreateProcessAsUserW failed: 5` remains unresolved at the environment level.
- Phase 16.22 verification: `.\node_modules\.bin\vitest.cmd run` in `frontend/` passed with 29 tests.
- Phase 16.22 verification: `.\node_modules\.bin\tsc.cmd -b` in `frontend/` passed.
- Phase 16.22 verification: `.\node_modules\.bin\vite.cmd build` in `frontend/` passed.
- Phase 16.22 verification: same-shell Vite preview HTTP smoke check returned `200` for `http://127.0.0.1:4173/admin/bookings?status=pending&page=2`.
- Phase 16.23 verification: `frontend/src/app/App.test.tsx` passed with 25 tests, including saved-view save/apply/remove coverage and a local `localStorage` shim for the Vitest environment.
- Phase 16.23 verification: `frontend/` typecheck passed with `tsc -b`.
- Phase 16.23 verification: `frontend/` build passed with `vite build`.
- Phase 16.23 verification: same-shell Vite preview HTTP smoke check returned `200` for `http://127.0.0.1:4173/admin/bookings?customerName=Ari%20Park&status=approved`.
- Phase 16.24 verification: `frontend/src/app/App.test.tsx` passed with 33 tests, including active-filter chip removal and clear-all coverage for `/admin/bookings`.
- Phase 16.24 verification: `frontend/` typecheck passed with `tsc -b`.
- Phase 16.24 verification: `frontend/` build passed with `vite build`.
- Phase 16.24 verification: same-shell Vite preview HTTP smoke checks returned `200` for `http://127.0.0.1:4173/admin/bookings` and `http://127.0.0.1:4173/admin/bookings?customerName=Ari%20Park&status=approved&risk=high&page=2&sortBy=startDate&sortOrder=asc`.
- Phase 16.24 verification: in-app browser smoke remains blocked by the known Codex Windows sandbox/runtime issue `CreateProcessAsUserW failed: 5`; no re-investigation was done in this slice.
- Phase 16.25 verification: `frontend/` Vitest suite passed with 36 tests using the local `frontend/node_modules/.bin/vitest.cmd` runner because the sandboxed bare npm shim issue remained unresolved.
- Phase 16.25 verification: `frontend/` typecheck passed with `frontend/node_modules/.bin/tsc.cmd -b`.
- Phase 16.25 verification: `frontend/` build passed with `frontend/node_modules/.bin/vite.cmd build`.
- Phase 16.25 verification: same-shell Vite preview HTTP smoke checks returned `200` for `http://127.0.0.1:4173/admin` and `http://127.0.0.1:4173/portal`.
- Phase 16.25 verification: in-app browser smoke remains blocked by the known Codex Windows sandbox/runtime issue `CreateProcessAsUserW failed: 5`; no re-investigation was done in this slice.
- Browser/in-app smoke remains blocked by the known Codex Windows sandbox/runtime error `CreateProcessAsUserW failed: 5`; no re-investigation was done in this slice.
- Phase 16.22 browser/in-app smoke was not retried because the known Codex Windows sandbox/runtime blocker `CreateProcessAsUserW failed: 5` remains unresolved at the environment level.

## Completion Criteria
- Required docs are current after every phase.
- Risky/security-sensitive changes receive explicit confirmation.
- Tests/checks pass where available, or blockers are documented.
- No secrets are printed or committed.
- Existing API behavior is preserved unless a change is explicitly planned and documented.
- Phase progress is updated after every completed task.
- Medium/high tasks ask for approval before implementation starts.
- Dependency health is audited, vulnerabilities are fixed or documented, packages are current within approved migration scope, and new packages are justified before adoption.
