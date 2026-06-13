# Code Standards

## Scope
These standards apply to Slotwise backend source under `src/` and test coverage under `tests/`.

## Layering Rules
- Routes compose controllers and register paths only.
- Controllers map HTTP input/output and should not contain persistence queries or booking business rules.
- Services own business rules, validation orchestration, availability checks, and external integration flow.
- Repositories own Mongoose queries, model instantiation, and persistence-specific filtering.
- Models define schema shape, validation hooks, and serialization behavior only.

## TypeScript Standards
- Prefer explicit function return types for exported functions, class methods, and repository/service contracts.
- Prefer narrow request parameter typing in Express handlers when route params are known.
- Use `Partial<T>` only for update payloads or clearly optional data shapes.
- Keep shared interfaces stable and update tests when contract changes are intentional.

## Error Handling
- Throw domain-meaningful errors from services and repositories.
- Do not leak secrets, raw env values, or external API credentials in error messages.
- Keep controllers responsible for HTTP status codes and response formatting.
- Preserve useful debugging context when wrapping errors, but avoid dumping raw objects into responses.

## Persistence Rules
- Do not access Mongoose models directly from controllers.
- Repository methods should describe intent, such as `findById`, `findAll`, `create`, `updateById`, `deleteById`, or targeted query helpers.
- Keep persistence details behind repository interfaces so service tests can stub repository behavior.
- Schema serialization should continue to strip legacy sensitive fields if present.

## Naming And Structure
- Use dot-case file naming for backend modules, matching the current project convention.
- Keep one primary responsibility per file.
- Prefer descriptive method names over comments that restate the code.
- Add brief comments only when a rule or workaround is not obvious from the code.

## Testing Standards
- Run compile verification after TypeScript changes.
- Run tests after business-logic or route-behavior changes.
- Prefer focused regression tests for bug fixes and architectural extractions.
- Keep external services mocked or stubbed in tests whenever possible.

## Change Discipline
- Make the smallest safe change that completes the current task.
- Update `IMPLEMENTATION_PLAN.md`, `TASKS_STATUS_MATRIX.md`, `AUDIT_REPORT.md`, and `CHANGELOG.md` after each implementation task.
- Treat package changes, renames, auth/security work, and architecture changes as approval-gated tasks.
