# Prompt Template: Rough Request to Engineering Task

Use this template whenever the user provides a rough, unclear, incomplete, or informal request.

Your role is to convert the rough request into a professional engineering task for this repository before implementation.

Do not start coding until the task is structured, scoped, and checked against the project governance files.

## Input

Paste the rough user request here:

```text
<rough request>
```

## Output

## 1. Task Type

Choose one or more:

`Bug Fix | Feature | Refactor | Documentation | Test | Architecture | Configuration | Audit | Security | Performance | UX/UI | DevOps`

## 2. Goal

State the desired outcome in one or two precise sentences.

## 3. Repository Context Check

Before planning, inspect the project governance files:

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

If any file is missing, outdated, inconsistent, or incomplete, document it before continuing.

Legacy `.agents/` files may be inspected if present, but `.codex/` is the preferred instruction directory for this repository.

## 4. Observed Behavior

Describe what currently happens.

If unknown, state exactly what must be inspected to confirm the current behavior.

## 5. Expected Behavior

Describe the target behavior, contract, user flow, API behavior, UI state, security behavior, or documentation state.

## 6. Files To Inspect

Start with mandatory governance files:

- `.codex/project-governor.md`
- `.codex/rough-request.prompt.md`
- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`
- `IMPLEMENTATION_PLAN.md`

For implementation tasks, also inspect when present:

- `.codex/rules/code-standards.md`
- `.codex/rules/strict-resource-management.md`

Then add only task-specific files after root-cause reasoning identifies them.

Do not scan unrelated files unless required.

## 7. Files Off Limits

Default off-limits files:

- `.codex/project-governor.md` unless the user explicitly requests governance-source edits
- `.env`
- `.venv/`
- `node_modules/`
- build output folders
- database files
- logs
- cache folders
- runtime artifacts
- unrelated source files

If a normally off-limits file must be changed, explain why and ask for confirmation first.

## 8. Dependencies

Prefer `None`.

If a new dependency is required, identify:

- package name
- reason
- affected dependency file
- security or maintenance risk
- required update to `SYSTEM_MAP.md`

## 9. Risks

Identify possible risks:

- security
- privacy
- data loss
- broken routes
- broken contracts
- authentication/authorization impact
- database migration risk
- dashboard/UI regression
- performance impact
- documentation drift
- test coverage gaps

## 10. Documentation Impact

State which files may need updates:

- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `AUDIT_REPORT.md`
- `TASKS_STATUS_MATRIX.md`
- `CHANGELOG.md`
- `IMPLEMENTATION_PLAN.md`
- `.codex/project-governor.md`
- `.codex/rough-request.prompt.md`
- `README.md`

Every implementation change must include a documentation impact decision.

## 11. Test Plan

List targeted verification commands or manual checks.

Prefer existing tests, linting, type checks, build commands, and direct smoke tests before adding new tools.

If tests are missing, document the gap and suggest minimal useful tests.

## 12. Model Recommendation

Choose the lowest sufficient model and reasoning level.

Default policy:

- Use `GPT-5 Codex` with low reasoning for documentation sync, markdown cleanup, prompt refinement, simple config edits, and final summaries.
- Use `GPT-5 Codex` with medium reasoning for normal implementation, bug fixes, tests, route fixes, single-module logic, and standard governance updates.
- Use `GPT-5 Codex` with high reasoning only for architecture changes, security-sensitive logic, authentication, cryptography, telemetry, complex debugging, or changes across three or more entangled files.

If a requested model is unavailable, write:

```text
Requested model unavailable in this runtime; using GPT-5 Codex with <low|medium|high> reasoning because <reason>.
```

Escalate only when necessary.

## 13. Quota-Saving Strategy

Use maximum quota-saving discipline:

- Read high-signal files first.
- Do not repeatedly reread unchanged files.
- Use targeted search instead of full-repository scanning.
- Inspect only files related to the current task.
- Batch related edits.
- Avoid unnecessary rewrites.
- Prefer minimal patches.
- Summarize findings before deep implementation.
- Keep governance files compact and useful.
- Reuse `PROJECT_CONTEXT.md` and `SYSTEM_MAP.md` as memory anchors.

## 14. Implementation Plan

Provide up to 10 concise steps.

Each step must include:

- purpose
- exact files likely to be touched
- expected verification method

## 15. Completion Criteria

The task is complete only when:

- root cause is identified
- implementation is minimal and scoped
- no unrelated files are changed
- tests/checks pass, or blockers are documented
- documentation impact is reported
- required governance docs are updated or update proposals are generated
- `.codex/project-governor.md` documentation impact report is produced or updated when governance changes
- `TASKS_STATUS_MATRIX.md` reflects the new task status when present
- `AUDIT_REPORT.md` is updated if risk, bug, gap, or debt was found

## 16. Final Response Format

When finished, respond with:

```markdown
## Summary
What changed.

## Files Changed
- file path - reason

## Verification
- command/check - result

## Documentation Impact
- updated files
- files requiring user review, if any

## Remaining Risks
- risk or `None`

## Next Recommended Task
One clear next step.
```
