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
- `npm run build` attempted; blocked by broken global npm path.
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
- `npm run build` attempted; blocked by broken global npm path.
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
- `npm run build` attempted; blocked by broken global npm path.
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
- `npm run build` remains blocked by the broken global npm install on this machine.
- `npm test` is configured, but cannot be exercised through npm until the global npm path issue is repaired.

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
- `npm run build` remains blocked by the broken global npm install on this machine.

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
4. Deferred CI because no Git provider/repository is present and npm execution is still unhealthy on this machine.

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
Status: Planned

Purpose: Make Slotwise easier to grow by introducing clear engineering standards and a repository boundary between business logic and persistence.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 9.1 Add `.codex/instructions.md` | Documentation | Planned | Low | No | Manual doc review |
| 9.2 Add `.codex/rules/code-standards.md` | Documentation | Planned | Low | No | Manual doc review |
| 9.3 Add `.codex/rules/strict-resource-management.md` | Documentation | Planned | Low | No | Manual doc review |
| 9.4 Introduce Repository Pattern | Architecture | Planned | High | Yes | Compile and tests |
| 9.5 Improve comments, error boundaries, and return types | Refactor | Planned | Medium | Yes | Compile and targeted review |

Architecture target:
- Controllers stay thin and handle HTTP request/response concerns.
- Services own business rules such as availability, email verification, and lifecycle transitions.
- Repositories own Mongoose access and persistence queries.
- Models define database shape only.
- Utilities remain pure or integration-focused helpers.

Verification:
- Compile and tests.
- Confirm no secrets are logged.
- Confirm booking service no longer directly depends on the Mongoose booking model after repository extraction.

## Phase 10: Mandatory Platform Features
Status: Planned

Purpose: Move Slotwise from basic CRUD toward a reliable booking platform.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 10.1 Full date-time availability logic | Bug Fix | Planned | Medium | Yes | Use `startDate`, `endDate`, `timein`, `timeout`. |
| 10.2 Booking status lifecycle | Feature | Planned | Medium | Yes | Add `cancelled` and `completed`. |
| 10.3 Admin approval/rejection endpoints | Security | Planned | High | Yes | Requires auth scope first. |
| 10.4 Search and filtering | Feature | Planned | Medium | Yes | Status, date range, email, phone, customer name. |
| 10.5 Pagination and sorting | Performance | Planned | Medium | Yes | Booking lists must scale. |
| 10.6 Audit trail for status changes | Security | Planned | High | Yes | Preserve accountability. |
| 10.7 Request validation layer | Architecture | Planned | Medium | Yes | Cleaner API contracts. |
| 10.8 Standard response format | Architecture | Planned | Medium | Yes | Consistent errors and success responses. |

Verification:
- Compile and tests.
- Add focused tests per behavior.
- Keep existing `/bookings` compatibility unless a breaking migration is approved.

## Phase 11: Professional Business Features
Status: Planned

Purpose: Make Slotwise adaptable across business types instead of tied to one booking scenario.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 11.1 Business profile model | Feature | Planned | High | Yes | Supports flexible business types. |
| 11.2 Service/resource model | Feature | Planned | High | Yes | Staff, rooms, tables, equipment, appointments, events. |
| 11.3 Configurable availability rules | Feature | Planned | High | Yes | Per-business rules. |
| 11.4 Working hours and blackout dates | Feature | Planned | High | Yes | Holidays, buffers, unavailable windows. |
| 11.5 Customer records | Feature | Planned | Medium | Yes | Link customers to bookings. |
| 11.6 Notification planning | Feature | Planned | Medium/High | Yes | Email/SMS reminders if provider is added. |
| 11.7 Cancellation and rescheduling | Feature | Planned | Medium | Yes | Customer/staff flows. |
| 11.8 Role model | Security | Planned | High | Yes | Owner, admin, staff, customer. |

Verification:
- Architecture notes before implementation.
- Schema/API review before model changes.
- Tests for each added domain rule.

## Phase 12: Creative Differentiator Features
Status: Planned

Purpose: Add product ideas that make Slotwise feel more useful, polished, and memorable after the core platform is stable.

Progress:
| Task | Type | Status | Model | Approval | Notes |
|---|---|---:|---|---|---|
| 12.1 Smart booking suggestions | Feature | Planned | High | Yes | Recommend best available slots. |
| 12.2 Conflict-risk indicators | Feature | Planned | Medium | Yes | Flag risk before approval. |
| 12.3 Booking timeline view | UX/UI | Planned | Medium | Yes | Backend/frontend coordination. |
| 12.4 No-show and cancellation insights | Feature | Planned | Medium | Yes | Analytics-oriented. |
| 12.5 Flexible business templates | Feature | Planned | Medium | Yes | Clinic, salon, restaurant, consultant, venue, rental. |
| 12.6 Embeddable booking widget plan | UX/UI | Planned | High | Yes | Public integration surface. |
| 12.7 Public booking page customization | UX/UI | Planned | Medium | Yes | Branding and fields. |
| 12.8 Analytics dashboard | Feature | Planned | Medium | Yes | Conversion, utilization, peak times, approval rate. |

Verification:
- Keep as planned features until core architecture and auth are stable.
- Add implementation specs before coding each feature.

## Phase 13: Attractive Professional Frontend/UI/UX
Status: Planned

Purpose: Define a serious, attractive, professional frontend direction before implementation starts.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 13.1 Add `UI_UX_DESIGN_BRIEF.md` | UX/UI | Done | Low | No | Manual doc review |
| 13.2 Define Slotwise brand direction | UX/UI | Planned | Low | No | Design brief review |
| 13.3 Plan admin dashboard | UX/UI | Planned | Low | No | Design brief review |
| 13.4 Plan customer portal | UX/UI | Planned | Low | No | Design brief review |
| 13.5 Plan responsive layouts | UX/UI | Planned | Low | No | Design brief review |
| 13.6 Define design system | UX/UI | Planned | Low | No | Design brief review |
| 13.7 Define accessibility requirements | UX/UI | Planned | Low | No | Design brief review |

Admin dashboard targets:
- Booking queue, status cards, calendar/timeline, filters/search, booking detail drawer/page, approve/reject/reschedule actions, customer profile view, and business settings.

Customer portal targets:
- Business/service selection, availability picker, customer details form, confirmation screen, booking status lookup, and reschedule/cancel request.

Design system targets:
- Colors, typography, spacing, buttons, forms, tables, badges, dialogs, empty states, loading states, error states, and success states.

Accessibility targets:
- Keyboard navigation, readable contrast, text labels for status, form error messages, and touch-friendly controls.

## Phase 14: Frontend Implementation Roadmap
Status: Deferred

Purpose: Preserve frontend implementation as a later architecture decision after UI/UX direction, auth, and platform APIs are clearer.

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

Deferred decisions:
- Frontend framework selection.
- UI component library.
- State management approach.
- Authentication UI.
- Deployment target.

## Phase 15: Dependency Audit And Modernization
Status: Done

Purpose: Keep Slotwise secure, current, and professionally maintained by auditing dependencies, fixing vulnerabilities, upgrading packages, and introducing modern packages only when they clearly improve the platform.

Progress:
| Task | Type | Status | Model | Approval | Verification |
|---|---|---:|---|---|---|
| 15.1 Repair npm runtime if still broken | DevOps | Done | Medium | Yes | Global shim still broken, but bundled CLI fallback works: `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js` |
| 15.2 Run dependency inventory | Audit | Done | Medium | Yes | Manifest fallback used because `npm ls --depth=0` is blocked by broken npm |
| 15.3 Run security audit | Security | Done | Medium | Yes | `npm audit` run through bundled CLI fallback |
| 15.4 Run safe audit fix | Security | Done | Medium | Yes | `npm audit fix` cleared vulnerabilities to 0 |
| 15.5 Review force fixes separately | Security | Planned | High | Yes | Manual migration review before `npm audit fix --force` |
| 15.6 Check outdated packages | Audit | Done | Medium | Yes | `npm outdated` run through bundled CLI fallback |
| 15.7 Update compatible packages | DevOps | Done | Medium | Yes | `npm update`, compile, tests |
| 15.8 Upgrade major versions with migration notes | Refactor | Done | High | Yes | `dotenv` 17, `express` 5, and `mongoose` 9 applied with targeted compatibility fixes |
| 15.9 Remove obsolete packages | DevOps | Done | Medium | Yes | Deprecated `@types/mongoose` removed; compile/tests passed |
| 15.10 Add required modern backend packages | Feature | Planned | Medium/High | Yes | Compile, tests, docs |
| 15.11 Add frontend packages only when frontend phase starts | UX/UI | Deferred | High | Yes | Frontend build/tests |
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
- npm remains known-unhealthy on this machine, so Phase 15 starts by repairing or verifying npm before package changes.

Current npm execution note:
- On June 10, 2026, `npm --version` failed because the active npm shim points to missing `C:\Users\omarz\AppData\Roaming\npm\node_modules\npm\bin\npm-cli.js`.
- A working fallback was confirmed with the bundled CLI: `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js`.
- Phase 15 audit commands can proceed through the bundled CLI, but the normal `npm` shim remains broken until the machine-level prefix/install issue is repaired.
- Current machine runtime note: Node is `v23.6.0`, which the official Node.js releases page marks as an EOL line as of June 10, 2026; the same page lists `v24.16.0` as current LTS and `v26.3.0` as current release.
- Current bundled npm note: `npm audit` reported npm `10.9.2` in use and npm `11.16.0` available, but npm itself was not upgraded because that is a machine-level toolchain change outside this repository.

Current manifest-based inventory:
- Final runtime: `axios@1.17.0`, `dotenv@17.4.2`, `express@5.2.1`, `libphonenumber-js@1.13.6`, `mongoose@9.7.0`, `validator@13.15.35`
- Final development: `@types/express@5.0.6`, `@types/validator@13.15.10`, `nodemon@3.1.14`, `ts-node@10.9.2`
- Obsolete package removed: `@types/mongoose`

Audit findings snapshot:
- Initial `npm audit` reported 17 vulnerabilities: 4 low, 3 moderate, 8 high, 2 critical.
- Direct dependency vulnerabilities affect `axios`, `express`, `mongoose`, and `validator`.
- Transitive vulnerability clusters include `body-parser`, `cookie`, `path-to-regexp`, `qs`, `send`, `serve-static`, `follow-redirects`, `form-data`, `brace-expansion`, `braces`, `diff`, `minimatch`, and `picomatch`.
- The approved `npm audit fix` completed successfully and a follow-up audit reported 0 vulnerabilities.

Outdated snapshot:
- Compatible updates were applied through `npm update`.
- Obsolete package cleanup completed: deprecated `@types/mongoose` was removed successfully.
- `dotenv` was upgraded to `17.4.2`; `src/config/env.ts` now sets `DOTENV_CONFIG_QUIET` and passes `quiet: true` to preserve quiet startup/test behavior.
- `express` was upgraded to `5.2.1` with `@types/express` `5.0.6`; `src/controllers/booking.controller.ts` now uses typed route params for Express 5 compatibility.
- `mongoose` was upgraded to `9.7.0`; `src/utils/validators.ts` now uses a minimal local cast inside `endDateValidator`, and `src/interfaces/booking.interface.ts` keeps `_id` as a required `mongoose.Types.ObjectId` for current Mongoose typing.
- Final project dependency state: `npm outdated` returned no remaining direct package updates for this repository after modernization.

## Completion Criteria
- Required docs are current after every phase.
- Risky/security-sensitive changes receive explicit confirmation.
- Tests/checks pass where available, or blockers are documented.
- No secrets are printed or committed.
- Existing API behavior is preserved unless a change is explicitly planned and documented.
- Phase progress is updated after every completed task.
- Medium/high tasks ask for approval before implementation starts.
- Dependency health is audited, vulnerabilities are fixed or documented, packages are current within approved migration scope, and new packages are justified before adoption.
