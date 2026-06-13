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
| Review date/time availability logic | Bug Fix | Done | Medium | Overlap check now uses `startDate`, `endDate`, `timein`, and `timeout`. |
| Fix phone validator return semantics | Bug Fix | Done | Medium | Validator now returns explicit booleans for valid and invalid phone input. |
| Plan API route polish | Architecture | Done | Medium | Added REST aliases while preserving all legacy routes. |
| Plan admin approval/auth flow | Security | Done | High | Added owner/admin role-gated approve/reject endpoints; full identity/session auth remains future hardening. |
| Add lint/format/CI policy | DevOps | Done | Low | Added `.gitignore`, `.editorconfig`, and documented why lint/CI tooling is still deferred. |
| Expand Slotwise implementation plan | Documentation | Done | High | Added phases 8-14 with progress tracking and model-switch policy. |
| Standardize Slotwise identity | Documentation | Done | High | Product-facing documentation now uses Slotwise; remaining legacy-name references are current workspace-folder or historical context only. |
| Rename package identity to slotwise-api | Configuration | Done | High | `package.json` and lockfile root metadata now use `slotwise-api`. |
| Rename source folders and files | Refactor | Done | High | Booking route, controller, service, model, and interface files now use professional dot-case naming while preserving `/bookings`. |
| Mitigate rename import/test risk | Test | Done | High | Renames were performed one path at a time with compile checks, tests, and targeted `rg` checks. |
| Mitigate root folder rename risk | DevOps | Done | High | Source/docs/tests are stable; live root folder rename remains a manual external workspace step because Codex is bound to the current `Booking System` path. |
| Add architecture and coding standards docs | Documentation | Done | High | Added `.codex/instructions.md`, `.codex/rules/code-standards.md`, and `.codex/rules/strict-resource-management.md`. |
| Introduce repository pattern | Architecture | Done | High | Booking service now uses `BookingRepository`; repository owns Mongoose model access. |
| Improve Phase 9 service contracts | Refactor | Done | Medium | Touched booking service methods now expose explicit public contracts and avoid raw error-object concatenation. |
| Add mandatory platform features | Feature | Done | High | Phase 10 is complete: availability, lifecycle, admin status actions, filtering, pagination, sorting, validation, standard responses, and status audit trail are done. |
| Mitigate Phase 10 carry-forward risks | Security | Done | High | Privileged status-action auth now uses bearer sessions, legacy history mitigation is in place, and normalized/indexed filter mitigation is complete. |
| Add Phase 11 domain foundations | Architecture | Done | High | Added business-profile, service-resource, and customer interfaces/models as the groundwork for professional business features. |
| Integrate Phase 11 booking workflows | Architecture | Done | High | Booking data and service logic now support business/customer/resource links, scoped scheduling rules, notification planning metadata, and reschedule history. |
| Add professional business features | Feature | Done | High | Phase 11 is complete: business profiles, service/resources, availability rules, working hours, customer records, notification planning, rescheduling, and staff/customer role flows are implemented. |
| Add persistent auth and notification foundations | Architecture | Done | High | Added operator-account, auth-session, verification-token, and notification-job interfaces/models for the post-Phase 11 hardening work. |
| Migrate operator auth to persistent sessions | Security | Done | High | `/auth/session` now uses Argon2-hashed operator accounts and MongoDB-backed hashed opaque sessions instead of in-memory state. |
| Add customer passwordless auth | Security | Done | High | Added magic-link request/verify flows, persistent customer sessions, and session-protected customer booking self-service routes. |
| Add notification outbox delivery | Feature | Done | High | Added provider-backed email outbox processing, worker lifecycle, retry handling, and booking/auth email execution. |
| Add creative differentiator features | Feature | Done | Medium | Phase 12 now includes smart booking suggestions, conflict-risk indicators, timeline feed, no-show insights, business templates, widget config, public booking-page customization, and dashboard analytics. |
| Add smart booking suggestions | Feature | Done | High | Added `POST /bookings/suggestions` with ranked nearby availability options using existing scheduling rules. |
| Add booking conflict-risk indicators | Feature | Done | Medium | `conflictRisk` is now persisted, filterable, and enriched with urgency, stale approval, repeat reschedule, large-party, tight-turnaround, and heavy-load signals. |
| Add booking timeline view | UX/UI | Done | Medium | Added `GET /bookings/timeline` with day-grouped bookings, sorted timeline entries, duration metadata, reschedule flags, and per-day summary counts. |
| Add no-show and cancellation insights | Feature | Done | Medium | Added explicit `no_show` lifecycle support plus `GET /bookings/insights/cancellation-no-show` analytics with rates, reasons, and weekday trends. |
| Add flexible business templates | Feature | Done | Medium | Added reusable business presets plus `GET /businesses/templates` and template-backed business-profile create/update support. |
| Add embeddable booking widget foundation | UX/UI | Done | High | Added persisted `widgetSettings` plus public `GET /businesses/public/:slug/widget` config with active-resource previews and booking endpoint hints. |
| Add public booking page customization | UX/UI | Done | Medium | Added persisted `publicPageSettings` plus public `GET /businesses/public/:slug/booking-page` config with branding copy, visibility toggles, and endpoint hints. |
| Add analytics dashboard | Feature | Done | Medium | Added `GET /bookings/insights/dashboard` with KPI summaries, lifecycle funnel counts, weekday/resource utilization, and peak booking-time aggregates. |
| Add UI/UX design brief | UX/UI | Done | High | Added `UI_UX_DESIGN_BRIEF.md` for admin dashboard and customer portal design foundation. |
| Define Slotwise brand direction | UX/UI | Done | Medium | Expanded the design brief with brand character, palette direction, visual tone, and typography guidance. |
| Plan admin dashboard UX | UX/UI | Done | Medium | Added admin information architecture, screen priorities, and dashboard/timeline planning to the brief. |
| Plan customer portal UX | UX/UI | Done | Medium | Added customer booking flow priorities and public booking/confirmation/management page structures. |
| Plan responsive layouts | UX/UI | Done | Medium | Added desktop, tablet, mobile admin, and mobile customer layout expectations. |
| Define frontend design system | UX/UI | Done | Medium | Added component, motion, status-chip, table, and control direction to the brief. |
| Define frontend accessibility requirements | UX/UI | Done | Medium | Added detailed accessibility expectations for focus, validation, labels, and state messaging. |
| Deepen UI/UX interaction patterns | UX/UI | Done | Medium | Expanded the brief with visual-language tokens, admin/customer interaction patterns, hosted-surface guidance, analytics presentation rules, and copy direction. |
| Add frontend localization guidance | UX/UI | Done | Medium | Expanded the brief with translation, locale-formatting, timezone, layout-expansion, and RTL-readiness requirements. |
| Add frontend planning gaps and operational UX standards | UX/UI | Done | Medium | Expanded the brief with a planning-gap checklist plus loading, error, privacy, feedback, form-resilience, and perceived-performance standards. |
| Plan frontend implementation roadmap | UX/UI | Done | High | Added `FRONTEND_IMPLEMENTATION_ROADMAP.md` and selected a future React + Vite + React Router + TanStack Query direction without adding packages or source code. |
| Add frontend approval/fix process | Documentation | Done | High | Added the pre-scaffold approval checklist for architecture/package adoption, token/session storage, deployment, SSR/pre-rendering, and widget style isolation. |
| Resolve Phase 14 remaining frontend planning risks | Documentation | Done | High | User approved the pre-scaffold decisions; roadmap now records memory-only token storage, static SPA deployment, deferred SSR/pre-rendering, iframe widget isolation, and implementation-time package review. |
| Run frontend package/security review | Audit | Done | High | Verified current npm metadata for the first frontend package set and approved proceeding with the isolated scaffold. |
| Scaffold isolated frontend workspace | UX/UI | Done | High | Added `frontend/` as a separate React/Vite TypeScript SPA with dashboard shell, API/session foundations, styling, tests, build verification, audit, and HTTP smoke check. |
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
| Renumber frontend/backend alignment as Phase 16 | Documentation | Done | High | Kept completed dependency modernization as Phase 15 and opened Phase 16 for frontend/backend feature alignment. |
| Create frontend-backend coverage matrix | Documentation / Audit | Done | High | Added the Phase 16 matrix in `IMPLEMENTATION_PLAN.md`, mapping implemented backend routes to current frontend scaffold coverage and target screens/components. |
| Add frontend route map and app shell routing | UX/UI | Done | High | Added React Router route map, shell links, admin/public-surface routes, responsive placeholder surfaces, and route navigation tests. |
