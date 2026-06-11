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

## API Convention
- Prefer the REST aliases documented in `README.md`.
- Keep legacy route paths working unless a breaking API migration is explicitly approved.

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
