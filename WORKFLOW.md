# Workflow

## Standard Flow
1. Inspect governance and context files before coding.
2. Inspect high-signal implementation files relevant to the task.
3. Produce or update a short plan.
4. Make minimal scoped changes.
5. Run available verification commands.
6. Update documentation and task status files after changes.

## Small Task Progress Flow
1. Pick one task from `IMPLEMENTATION_PLAN.md`.
2. Mark or keep its status clear: `Planned`, `In Progress`, `Done`, `Blocked`, or `Deferred`.
3. Read only the files required for that task.
4. Make the smallest safe change.
5. Run the task-specific verification.
6. Update `IMPLEMENTATION_PLAN.md`, `TASKS_STATUS_MATRIX.md`, `CHANGELOG.md`, and any relevant docs before moving on.

## Before Coding Checklist
- Read `.codex/project-governor.md` if present.
- Read `.codex/rough-request.prompt.md` for rough or informal requests.
- Read `.codex/instructions.md` if present.
- Read `.codex/rules/*` files relevant to the task if present.
- Read root governance docs: `PROJECT_CONTEXT.md`, `SYSTEM_MAP.md`, `WORKFLOW.md`, `TASKS_STATUS_MATRIX.md`, `AUDIT_REPORT.md`, `CHANGELOG.md`, and `IMPLEMENTATION_PLAN.md`.
- Check `.agents/*` only as a legacy fallback if present.
- Do not print `.env` values.
- Avoid `node_modules/`, build outputs, logs, caches, and unrelated files.

## Commands
- Install: `npm install`
- Development: `npm run dev`
- Build: `npm run build`
- Build fallback while global npm is broken: `.\node_modules\.bin\tsc.cmd`
- Start: `npm start`
- Tests: `npm test`
- Test fallback while global npm is broken: `node --test tests\*.test.js`
- Booking metadata backfill: `npm run backfill:bookings`
- Optional MongoDB SRV DNS override for affected environments: set `SLOTWISE_DNS_SERVERS`
- Frontend development: from `frontend/`, run `npm run dev -- --host 127.0.0.1 --port 5173`
- Frontend build: from `frontend/`, run `npm run build`
- Frontend tests: from `frontend/`, run `npm run test:run`
- Frontend audit: from `frontend/`, run `npm audit --audit-level=moderate`
- Dependency audit: `npm audit`
- Safe vulnerability fix: `npm audit fix`
- Outdated package review: `npm outdated`
- Compatible package update: `npm update`
- Dependency inventory: `npm ls --depth=0`
- Bundled npm CLI fallback when the `npm` shim is broken: `node C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js <command>`

## Verification Policy
Run `npm run build` after TypeScript changes. Run `npm test` after behavior changes, or `node --test tests\*.test.js` if npm is still unavailable.
If global `npm` cannot locate `npm-cli.js`, run the local TypeScript compiler directly with `.\node_modules\.bin\tsc.cmd` and document the npm blocker.
If global `npm` cannot locate `npm-cli.js`, Phase 15 audit commands may use the bundled npm CLI fallback, but package-changing commands still require explicit approval first.
After dependency modernization, keep `package.json` and the lockfile root package metadata aligned with the installed direct dependency versions so a fresh install reproduces the audited state.
If Codex sandbox path restrictions break `npm`, verify the same command in an unsandboxed shell before treating it as a real machine-level npm failure.
For documentation-only Phase 13 planning work, manual brief review and cross-doc sync checks are sufficient verification; when the brief is deepened, verify the new guidance is reflected in the plan, task matrix, audit notes, changelog, and any project docs that describe the frontend planning scope, including localization expectations and newly documented frontend gaps.
For documentation-only Phase 14 frontend implementation planning/selection work, manual roadmap review and targeted markdown sync checks are sufficient verification. Do not scaffold frontend source, install frontend packages, or change auth/session behavior without explicit approval.
For approved frontend implementation work, run frontend install/audit when package changes are involved, then run frontend build and tests. Use the in-app browser for visual QA when available; if the browser runtime is blocked, document the blocker and run a local HTTP smoke check.
For Phase 16 frontend/backend alignment work, update `IMPLEMENTATION_PLAN.md` after each small task and keep the coverage matrix current. Low reasoning is sufficient for documentation/audit-only updates, medium is required for frontend routes/API/components/tests, and high is required before auth, customer sessions, or lifecycle action UI.

## API Convention
- Prefer the REST aliases documented in `README.md`.
- Keep legacy route paths working unless a breaking API migration is explicitly approved.
- Use `POST /auth/session` to obtain a bearer session for privileged status-action routes.
- Use `POST /auth/customer/magic-link` and `POST /auth/customer/verify` for the persistent customer sign-in flow.
- Use `GET /bookings/insights/dashboard` for the current backend dashboard analytics feed.
- Use `GET /bookings/timeline` for the current backend timeline/calendar feed.
- Use `/businesses`, `/service-resources`, and `/customers` for Phase 11 management flows.
- Use `GET /businesses/public/:slug/booking-page` for the current public hosted booking-page bootstrap/config flow.
- Use `GET /businesses/public/:slug/widget` for the current public widget bootstrap/config flow.
- Use `PATCH /bookings/:id/reschedule` for staff/operator rescheduling and the `customer-*` booking routes for lightweight customer self-service flows.
- Treat the operator-session flow as persistent internal operator auth and the customer magic-link flow as the current end-user identity surface.

## Backend Layering
- Keep routes focused on endpoint registration and controller composition.
- Keep controllers focused on HTTP request/response mapping.
- Keep services focused on business rules, availability, email verification flow, and lifecycle decisions.
- Keep repositories focused on persistence queries and Mongoose model access.
- Prefer constructor injection for service/controller tests while preserving runtime `getInstance()` compatibility where it already exists.

## Maintenance Policy
- Treat `node_modules/` as local-only dependency cache.
- Treat `dist/` as disposable build output.
- Keep `.env` files out of source control.
- Defer CI until a real Git provider/repository exists.
- Defer lint/format tool installation until npm is healthy enough to install and run them reliably.
- Run dependency modernization as a dedicated task, not mixed into unrelated feature work.
- Do not use `npm audit fix --force` without explicit approval and a migration checklist.
- Introduce new packages only after documenting purpose, maintenance/security posture, implementation impact, and verification.

## Model Switch Policy
- Stay on low reasoning for documentation, planning, markdown cleanup, and final summaries.
- Ask immediately before switching to medium reasoning for implementation, bug fixes, tests, imports, package metadata, file/folder renames, and config changes.
- Ask immediately before switching to high reasoning for password handling, auth/admin flow, authorization, security-sensitive logic, repository extraction, multi-business architecture, payment/notification workflows, or cross-layer changes.
- If model-switch approval is not granted, stop before implementation and document the task as blocked.
