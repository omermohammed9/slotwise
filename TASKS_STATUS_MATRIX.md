# Tasks Status Matrix

| Task | Type | Status | Priority | Notes |
|---|---|---:|---:|---|
| Create governance docs | Documentation | Done | High | Baseline root docs created. |
| Add Codex instruction surface | Documentation | Done | High | `.codex/project-governor.md` added as preferred governance source. |
| Add rough request prompt template | Documentation | Done | High | `.codex/rough-request.prompt.md` created and added to pre-coding checks. |
| Write full phased implementation plan | Documentation | Done | High | Includes model matrix and implementation phases. |
| Add README | Documentation | Done | Medium | Added setup instructions, route reference, examples, and known gaps. |
| Add `.env.example` | Configuration | Done | High | Documents `PORT`, `MONGODB_URI`, and `HUNTER_API_KEY` without exposing secrets. |
| Normalize dotenv loading | Configuration | Done | High | Added `src/config/env.ts`; root `.env` preferred with `src/.env` fallback. |
| Add required env validation and `PORT` fallback | Configuration | Done | High | Added required env helper and `PORT` fallback to `3000`. |
| Add tests | Test | Done | High | Added Node built-in tests for validators, booking service behavior, and controller status handling. |
| Fix partial update email validation | Bug Fix | Done | High | Update now verifies email only when email is supplied. |
| Fix delete response semantics | Bug Fix | Done | Medium | Successful delete now returns empty `204`; missing booking returns `404`. |
| Add not-found behavior | Bug Fix | Done | Medium | Get/update/delete now return `404` when no booking is found. |
| Review password handling | Security | Done | High | Removed password from booking schema/interface and added serialization guard for legacy data. |
| Review date/time availability logic | Bug Fix | Pending | Medium | Current overlap check uses only `startDate`/`endDate`. |
| Fix phone validator return semantics | Bug Fix | Done | Medium | Validator now returns explicit booleans for valid and invalid phone input. |
| Plan API route polish | Architecture | Done | Medium | Added REST aliases while preserving all legacy routes. |
| Plan admin approval/auth flow | Security | Deferred | High | Approval/rejection endpoints remain blocked on auth scope and role model design. |
| Add lint/format/CI policy | DevOps | Done | Low | Added `.gitignore`, `.editorconfig`, and documented why lint/CI tooling is still deferred. |
| Expand Slotwise implementation plan | Documentation | Done | High | Added phases 8-14 with progress tracking and model-switch policy. |
| Standardize Slotwise identity | Documentation | Done | High | Product-facing documentation now uses Slotwise; remaining legacy-name references are current workspace-folder or historical context only. |
| Rename package identity to slotwise-api | Configuration | Done | High | `package.json` and lockfile root metadata now use `slotwise-api`. |
| Rename source folders and files | Refactor | Done | High | Booking route, controller, service, model, and interface files now use professional dot-case naming while preserving `/bookings`. |
| Mitigate rename import/test risk | Test | Done | High | Renames were performed one path at a time with compile checks, tests, and targeted `rg` checks. |
| Mitigate root folder rename risk | DevOps | Done | High | Source/docs/tests are stable; live root folder rename remains a manual external workspace step because Codex is bound to the current `Booking System` path. |
| Add architecture and coding standards docs | Documentation | Planned | High | Missing `.codex` standards docs are planned. |
| Introduce repository pattern | Architecture | Planned | High | Service should own business rules; repository should own Mongoose access. |
| Add mandatory platform features | Feature | Planned | High | Availability, lifecycle, admin, filtering, pagination, audit, validation, responses. |
| Add professional business features | Feature | Planned | High | Business profiles, resources, availability rules, customers, notifications, roles. |
| Add creative differentiator features | Feature | Planned | Medium | Suggestions, risk indicators, templates, widget, public page, analytics. |
| Add UI/UX design brief | UX/UI | Done | High | Added `UI_UX_DESIGN_BRIEF.md` for admin dashboard and customer portal design foundation. |
| Plan frontend implementation roadmap | UX/UI | Deferred | High | Framework and app implementation decisions remain deferred. |
| Add dependency audit and modernization phase | Documentation | Done | High | Added Phase 15 with audit, update, fix, package adoption, and migration rules. |
| Repair npm runtime | DevOps | Done | High | Confirmed bundled npm CLI fallback works even though the normal npm shim still points to a missing roaming install path. |
| Run npm audit and fix vulnerabilities | Security | Done | High | `npm audit fix` completed successfully and follow-up audit reported 0 vulnerabilities. |
| Update existing packages | DevOps | Done | High | Safe compatible updates applied with `npm update`; major-version work was completed afterward. |
| Evaluate modern required packages | Architecture | Planned | High | Consider security, validation, logging, testing, API docs, config validation, and frontend packages when justified. |
| Run dependency inventory | Audit | Done | High | Inventory confirmed from `npm ls --depth=0` through the bundled npm CLI fallback. |
| Remove deprecated @types/mongoose | DevOps | Done | High | Deprecated package removed successfully; compile and tests still pass. |
| Upgrade dotenv to 17.x | Configuration | Done | High | Upgraded to `17.4.2`; added quiet-mode env loader workaround; compile and tests pass. |
| Upgrade Express to 5.x | Refactor | Done | High | Upgraded to `5.2.1` with `@types/express` `5.0.6`; controller route params typed for compatibility; compile and tests pass. |
| Upgrade Mongoose to 9.x | Refactor | Done | High | Upgraded to `9.7.0`; adjusted `_id` and validator typing for compatibility; compile and tests pass. |
| Align dependency manifest to final audited state | Configuration | Done | High | `package.json` and lockfile root metadata now reflect the final direct dependency versions. |
