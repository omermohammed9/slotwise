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
- `src/controllers/booking.controller.ts` translates HTTP requests into service calls.
- `src/services/booking.service.ts` contains booking creation, availability, email verification, and CRUD logic.
- `src/models/booking.model.ts` defines the Mongoose booking schema.
- `src/interfaces/booking.interface.ts` defines the booking document type.
- `src/utils/validators.ts` contains field validators.
- `src/utils/emailVerifier.ts` calls Hunter's email verification API.
- `tests/*.test.js` contains Node built-in tests for validators, service logic, and controller behavior against compiled output.
- `README.md` documents setup, routes, examples, and known gaps.
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
- Ignore rules and editor defaults are now in place, but lint/format tooling is still intentionally deferred.

## Current Execution Plan
- Use `IMPLEMENTATION_PLAN.md` as the active phase plan.
- Use GPT-5 Codex low reasoning for planning and documentation updates.
- Ask immediately before switching to medium for implementation/config/test/rename work.
- Ask immediately before switching to high for architecture, authentication, authorization, security-sensitive logic, multi-business design, payment/notification workflows, or cross-layer changes.
- Current planned direction: Repository Pattern, mandatory platform features, professional business features, creative differentiators, and a future admin/customer frontend.
- Phase 15 audit status: dependency inventory, `npm audit`, and `npm outdated` can run through the bundled CLI fallback; the repository dependency modernization work is now complete.
- Phase 15 current status: runtime packages are modernized to current direct versions, audit status is 0 vulnerabilities, and compile/tests pass after small compatibility fixes in env loading, controller param typing, Mongoose `_id` typing, and date-validator `this` handling.
- Remaining environment-level gap: machine Node is still `v23.6.0` on an EOL line, and upgrading it to LTS `24.16.0` is blocked by a Windows Installer admin requirement.
