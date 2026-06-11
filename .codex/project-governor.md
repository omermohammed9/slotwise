# Codex Project Governor

## Purpose
This file is the primary Codex instruction source for this repository. Use `.codex/` for Codex-specific governance, rules, prompts, and task preparation instructions.

## Required Pre-Coding Files
Before implementation, inspect these files when present:
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

Legacy `.agents/` files may be inspected if present, but they are not the only governance location. Prefer `.codex/` for new or updated Codex instructions.

## Rough Request Handling
When the user provides a rough, unclear, incomplete, or informal request:
1. Convert it into a professional engineering task before implementation.
2. Classify the task type.
3. State the goal and expected behavior.
4. Inspect the required pre-coding files.
5. Identify task-specific files only after root-cause reasoning.
6. List risks, documentation impact, and verification.
7. Choose the lowest sufficient model/reasoning level.
8. Ask before switching models.

## Documentation Impact
Every implementation change must decide whether these files need updates:
- `PROJECT_CONTEXT.md`
- `SYSTEM_MAP.md`
- `WORKFLOW.md`
- `TASKS_STATUS_MATRIX.md`
- `AUDIT_REPORT.md`
- `CHANGELOG.md`
- `IMPLEMENTATION_PLAN.md`
- `.codex/rough-request.prompt.md`
- `.codex/project-governor.md`
- `README.md`

## Off-Limits By Default
- `.env`
- `node_modules/`
- build output folders
- database files
- logs
- cache folders
- unrelated source files

Ask before modifying normally off-limits files.

## Completion Criteria
A task is complete only when:
- Root cause or scope is clear.
- Changes are minimal and scoped.
- Verification has run or blockers are documented.
- Documentation impact is reported.
- Task status and audit docs are updated when relevant.
