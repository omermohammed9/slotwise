# Codex Instructions

## Scope
These instructions apply to the Slotwise backend repository at `C:\Users\omarz\Desktop\Slotwise`.

## Current Product State
- Product name: `Slotwise`
- Package name: `slotwise-api`
- Runtime: TypeScript on Node.js
- Framework: Express
- Persistence: MongoDB through Mongoose
- External integration: Hunter email verification API

## Required Reading Order
Before implementation, inspect:
1. `.codex/project-governor.md`
2. `.codex/rough-request.prompt.md`
3. `.codex/instructions.md`
4. `.codex/rules/code-standards.md`
5. `.codex/rules/strict-resource-management.md`
6. `PROJECT_CONTEXT.md`
7. `SYSTEM_MAP.md`
8. `WORKFLOW.md`
9. `TASKS_STATUS_MATRIX.md`
10. `AUDIT_REPORT.md`
11. `CHANGELOG.md`
12. `IMPLEMENTATION_PLAN.md`

## Phase Discipline
- Implement only the approved phase and only the active small task.
- Update `IMPLEMENTATION_PLAN.md` after each completed implementation task.
- Update `TASKS_STATUS_MATRIX.md`, `AUDIT_REPORT.md`, `CHANGELOG.md`, and any affected docs before moving to the next task.
- Stop and ask before medium/high reasoning work, package changes, renames, architecture changes, auth/security work, or destructive actions.

## Backend Boundaries
- Routes register endpoints and compose controllers only.
- Controllers handle HTTP request/response mapping only.
- Services own business rules and external workflow coordination.
- Repositories own persistence queries and model access.
- Models define schema shape and serialization rules only.
- Utilities stay pure or integration-focused.

## Safe Working Rules
- Keep `/bookings` route compatibility unless a breaking change is explicitly approved.
- Do not touch `.env`, `node_modules/`, `dist/`, logs, caches, or unrelated files.
- Prefer small, reversible changes with targeted verification after each step.
- Document any temporary compatibility layer or deferred migration explicitly.
