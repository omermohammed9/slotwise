# Strict Resource Management

## Purpose
Slotwise should handle database, network, process, and response resources deliberately so small backend changes do not create leaks, noisy failures, or hidden coupling.

## Database Rules
- Open the HTTP listener only after MongoDB connection succeeds.
- Keep database connection setup in `src/config/db.ts` and startup orchestration in `src/app.ts`.
- Do not open ad hoc Mongoose connections inside controllers, services, repositories, or utilities.
- Repository methods must reuse the shared model/connection context instead of creating new persistence clients.

## External API Rules
- Keep Hunter API access isolated to `src/utils/emailVerifier.ts` or a dedicated integration helper.
- Do not duplicate outbound HTTP client setup across business-layer files without a documented reason.
- Fail external calls with concise, non-secret error messages.
- Avoid logging raw external payloads if they may include user or credential data.

## Request Lifecycle Rules
- Send exactly one HTTP response per controller action.
- Return early after terminal response branches such as `404` and `204`.
- Keep long-running or multi-step business work in services so controllers remain easy to reason about.

## Error And Cleanup Rules
- Wrap persistence or external-call failures at the layer that understands the failure context best.
- Preserve enough context to debug expected failures, but never expose secrets, tokens, or env values.
- If a future task introduces streams, file handles, timers, or subscriptions, it must also introduce explicit cleanup paths.

## Test Resource Rules
- Tests should avoid live MongoDB and live Hunter API dependencies unless the task explicitly requires an integration test.
- Stub repository and integration boundaries where possible so tests stay deterministic.
- After future integration-style tests, close any opened server, database, or timer resources explicitly.

## Change Control
- Treat connection-lifecycle changes, new external clients, background jobs, caching layers, and shared singletons as approval-sensitive work.
- Document any new long-lived resource in `SYSTEM_MAP.md`, `PROJECT_CONTEXT.md`, and `AUDIT_REPORT.md`.
