# Slotwise Frontend Implementation Roadmap

## Purpose
This document is the Phase 14 planning and selection artifact for the Slotwise frontend. It records the original implementation direction plus the approved first-scaffold decisions that led to the current `frontend/` app.

Phase 14 itself stayed planning-only. The later `frontend/` scaffold and Phase 16 implementation slices are recorded here only so the original planning decisions and the current frontend baseline stay in one place.

This document is now also the frontend-facing status companion for the production-readiness hardening work completed after Phase 16. The current frontend no longer represents only a first admin scaffold: it includes role-aware owner/admin/staff routes, public booking surfaces, customer portal flows, CSRF-aware API handling, audit and user administration surfaces, and a light/dark theme foundation.

The July 5, 2026 alignment closure also records the current dependency/build posture: safe frontend package updates are applied, the audit result is 0 vulnerabilities, production builds use manual Vite chunks without the prior chunk-size warning, and `react-router` 8 remains a deferred major-version migration.

## Selection Summary
- App model: a separate TypeScript single-page frontend app that consumes the existing Slotwise API.
- Framework direction: React with Vite.
- Routing direction: React Router in SPA/data-router mode.
- Server-state direction: TanStack Query for API reads, mutations, cache invalidation, loading states, and optimistic continuity where appropriate.
- Styling direction: design-token-first CSS with Tailwind CSS as the likely utility layer, plus a small set of accessible headless primitives where needed.
- Component posture: build Slotwise-specific operational components first; avoid a heavy pre-styled admin template.
- Initial surfaces: admin/operator app first, then public booking page, then embeddable widget.

This selection keeps the frontend independent from the Express backend, allows static deployment later, and fits the existing API-first backend. Official docs reviewed during this planning pass: React recommends starting new production apps with a framework, Vite supports React TypeScript templates and fast dev/build defaults, React Router supports SPA/data/framework modes, and TanStack Query provides the server-state layer needed for API-heavy React apps.

## Why This Direction
- Slotwise already has an API-first Express backend; a separate SPA avoids coupling UI routing to backend route handlers.
- The admin dashboard is data-heavy and needs fast filtering, detail panels, query cache management, mutation states, and stable partial refreshes.
- The public booking page and widget can share the same component foundation without requiring server-side rendering in the first implementation slice.
- The selected direction avoids a broad architecture change inside the backend repository until package and folder layout are approved.

## Approved Pre-Scaffold Decisions
- Architecture/package adoption: approved for a separate `frontend/` TypeScript SPA using React, Vite, React Router, TanStack Query, Tailwind CSS, and Slotwise-owned components.
- Package categories approved for future install review: React app/runtime, routing, server-state, styling, accessible primitives, forms, schema validation, date/time utilities, charts, icons, unit/component tests, browser tests, and accessibility checks.
- Preferred package candidates for implementation-time review: `react`, `react-dom`, `vite`, `typescript`, `@vitejs/plugin-react`, `react-router`, `@tanstack/react-query`, `tailwindcss`, `@tailwindcss/vite`, Radix UI primitives where needed, `react-hook-form`, `zod`, `date-fns`, `recharts`, `lucide-react`, `vitest`, Testing Library, Playwright, and axe-based accessibility tooling.
- Token/session storage: approved baseline is in-memory bearer-token storage only for the first frontend slice. Do not use `localStorage` for operator or customer session tokens. A later persistent-login upgrade should prefer server-managed `HttpOnly`, `Secure`, `SameSite` cookies and requires a backend auth/session review.
- Deployment topology: approved baseline is a separately built static SPA served by a frontend host or static asset host, configured with an API base URL per environment.
- SSR/pre-rendering: deferred for the first implementation slice. Reconsider only if public booking pages need SEO, white-label landing behavior, or materially faster unauthenticated public page rendering.
- Widget style isolation: approved baseline is an iframe-based embed for third-party host websites. Shadow DOM may be used later for trusted first-party embeds only after host CSS/script interference is tested.
- Scaffolding gate: `frontend/` may be created only after implementation-time package version/security checks are run and the package list is confirmed.

## Implementation-Time Package Review Snapshot
- Review date: June 13, 2026.
- Registry source: npm metadata through the bundled npm CLI fallback.
- Approved first-slice runtime packages: `react@19.2.7`, `react-dom@19.2.7`, `react-router@7.17.0`, `@tanstack/react-query@5.101.0`, `tailwindcss@4.3.1`, `@tailwindcss/vite@4.3.1`, `react-hook-form@7.79.0`, `zod@4.4.3`, `date-fns@4.4.0`, `recharts@3.8.1`, `lucide-react@1.18.0`.
- Approved first-slice development packages: `vite@8.0.16`, `typescript@6.0.3`, `@vitejs/plugin-react@6.0.2`, `@types/react@19.2.17`, `@types/react-dom@19.2.3`, `vitest@4.1.8`, `jsdom@29.1.1`, `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `@testing-library/user-event@14.6.1`, `playwright@1.60.0`, `axe-core@4.12.1`, `@axe-core/playwright@4.11.3`.
- License snapshot: MIT for most packages, Apache-2.0 for TypeScript and Playwright, ISC for `lucide-react`, and MPL-2.0 for axe packages.
- Decision: proceed with the approved package set for the first isolated frontend scaffold.
- Install result: `npm install` through the bundled npm CLI fallback completed with 0 reported vulnerabilities.
- Follow-up audit result: `npm audit --audit-level=moderate` completed with 0 vulnerabilities.

## July 5, 2026 Package And Build Snapshot
- Current safe-update scope is applied for the frontend dependency tree, including the wanted-version updates for Vite, Vitest, React Router 7, TanStack Query, Tailwind CSS, React Hook Form, Recharts, Lucide React, Playwright, and axe Playwright tooling.
- Frontend audit reports 0 vulnerabilities after a non-force audit repair of the transitive `undici` advisory.
- `react-router@8.1.0` is intentionally deferred because it is a major upgrade from the current wanted `7.18.1` line.
- `frontend/tsconfig.app.json` and `frontend/tsconfig.node.json` include the current TypeScript deprecation compatibility setting required by the installed compiler line.
- `frontend/vite.config.ts` defines manual chunks for stable dependency groups so `npm run build` passes without the previous Vite chunk-size warning.
- Latest verification for this closure: `npm run build` passed, `npm run test:run` passed with 50 tests, `npm audit` reported 0 vulnerabilities, and `npm outdated` only reported the deferred React Router major.

## First Scaffold Snapshot
- `frontend/` now exists as a separate Vite + React + TypeScript app.
- The first screen is an operational admin dashboard shell with navigation, KPI cards, booking queue, timeline, memory-session posture, and widget-isolation note.
- API client foundations use the existing Slotwise response envelope shape and default to `http://localhost:3000`.
- Session storage foundation uses memory-only token storage for the first slice.
- Tests cover the dashboard render path and default API base URL.
- Current frontend commands: `npm run dev`, `npm run build`, `npm run typecheck`, `npm run test:run`, and `npm run preview`.
- Verification passed: production build, Vitest run, npm audit, and a same-shell HTTP smoke check against Vite returning `200` for `/` and `/src/main.tsx`.
- Browser QA note: the in-app browser was unavailable because the Windows sandbox failed to start the browser runtime with `CreateProcessAsUserW failed: 5`; visual browser verification remains a follow-up.
- Dev-server note: Vite starts correctly in the foreground, but this environment tears down detached hidden dev-server processes after the launching shell exits. Use `npm run dev -- --host 127.0.0.1 --port 5173` from `frontend/` for local interactive testing.

## Phase 16 Alignment Snapshot
- The frontend/backend alignment phase is now Phase 16 because Phase 15 is already used for completed dependency modernization.
- The Phase 16 coverage matrix lives in `IMPLEMENTATION_PLAN.md`.
- Current admin coverage now includes the app shell, memory-only operator session, query-backed dashboard analytics, cancellation/no-show insights, bookings, timeline, customers, settings, resources, business creation, advanced business settings, and settings template-preview screens over existing backend APIs.
- Route-map/app-shell routing is complete with central route metadata, shell links, role-aware admin routes, public-surface routes, responsive styling, and route navigation tests.
- Shared API DTO/client modules are complete with typed wrappers for auth, bookings, businesses, service/resources, customers, public booking-page config, and widget config. Business list reads can now include `businessId` query scope.
- Operator auth screens and memory-session flow are complete with `/login`, protected admin routes, memory-only session metadata, and logout UI.
- The bookings list slice is complete with a query-backed `/admin/bookings` screen, customer search, status/risk filters, sorting, pagination controls, responsive record rendering, URL-persistent list state for reload/share-safe admin views, and browser-local saved views for lightweight operator workspace recall.
- The booking detail slice is complete with a drawer backed by `GET /bookings/:id`, covering contact, schedule, notes, conflict risk, operational IDs, status history, generic booking edits, owner/admin deletion, role-aware lifecycle actions with reason text, operator rescheduling, and nearby suggestions.
- The booking lifecycle actions slice is complete with approve, reject, cancel, complete, and no-show mutations gated by operator role and confirmation prompts.
- The booking reschedule and suggestion slice is complete for operator-managed pending/approved bookings without customer magic-link/session storage changes.
- The timeline/calendar slice is complete with a query-backed `/admin/timeline` view, filters, summary metrics, day groups, risk markers, and reschedule badges.
- The dashboard analytics slice is complete with query-backed KPI, lifecycle funnel, utilization, and peak-time panels.
- Cancellation/no-show insights now appear on `/admin` with summary cards, weekday trend bars, and reason summaries using the existing dashboard filters.
- Business settings now have query-backed profile selection, business creation, editable profile basics, working-hours and blackout-date editors, advanced availability/notification/widget/public-page settings editors, save mutation states, operating-readiness summaries, and read-only business template gallery/preview coverage on `/admin/settings`.
- Service/resource management now has query-backed filters, resource list states, create form, active/inactive toggles, edit drawers, and availability override editing on `/admin/resources`.
- Customer management now has query-backed filters, a customer directory, create/edit flows, profile details, and booking-history entry points on `/admin/customers`.
- Public booking page flow is complete on `/book/:slug` with backend-config branding, service/resource selection, date/time and customer detail inputs, party-size/notes support, suggestion feedback, submit states, success/error/empty states, and responsive public layout.
- Customer portal flow is complete on `/portal` with request/verify token states, isolated memory-only customer sessions, booking lookup/filtering, status/history views, customer cancel/reschedule actions, and lightweight public-page handoff links over the existing backend routes only.
- The approved 16.25 session-hardening slice is now complete for `/login`, protected admin routes, and `/portal`, adding current-session revalidation for real backend-issued sessions on entry/focus, refreshed memory-only session metadata, and explicit expiry messaging without persistent storage.
- Shared admin loading and inline success/error state helpers now support the touched Phase 16 admin surfaces.
- Responsive and accessibility QA is complete for existing Phase 16 admin screens, covering mobile/tablet layout resilience, focus states, live state messaging, selected/pressed states, dialog semantics, and long-text overflow.
- The approved 16.21 admin/public-surface hardening slice is now complete for `/book/:slug`, `/widget/:slug`, and `/portal`, the approved 16.22 admin hardening slice is now complete for `/admin/bookings` URL-state persistence, the approved 16.23 admin hardening slice is now complete for browser-local `/admin/bookings` saved views, and the approved 16.24 admin hardening slice is now complete for lightweight removable filter chips plus a clear-all reset on `/admin/bookings`; the next implementation slice remains another separately approved frontend hardening or session-work slice.
- All Phase 16 UI work must stay reusable, responsive, minimal, and aligned with `UI_UX_DESIGN_BRIEF.md`; auth/session and lifecycle-action screens remain high-reasoning approval gates.

## Production-Readiness Frontend Snapshot
- The frontend API client now expects browser-cookie auth to be used alongside the in-memory session metadata and includes CSRF-token handling for unsafe cookie-authenticated requests.
- API errors now carry frontend-friendly error codes for unauthenticated, forbidden, CSRF/session mismatch, rate-limited, network, and unknown failures.
- `/login` remains the operator sign-in entry point and is paired with sign-out, current-session revalidation, expiry notices, forbidden-route handling, and rate/security-aware error messaging.
- The single operator shell has been split into role-aware portal routes:
  - `/owner` for owner dashboard access.
  - `/owner/users` for owner-controlled operator invitation, role, and status management.
  - `/owner/audit` for owner audit-log review.
  - `/admin` for admin dashboard access.
  - `/admin/bookings`, `/admin/timeline`, `/admin/customers`, `/admin/resources`, `/admin/settings`, and `/admin/audit` for admin operations where role rules allow them.
  - `/staff`, `/staff/timeline`, and `/staff/customers` for staff-limited operational workflows.
- `ProtectedAdminLayout` now blocks direct access to routes outside the current operator role and redirects blocked users to `/forbidden`.
- `AppShell` filters navigation based on the current role so inaccessible owner/admin/staff destinations are not shown as primary actions.
- `UserAdminPage` adds the first owner-facing account administration UI over the operator-management API.
- `AuditLogPage` adds the first owner/admin-facing audit visibility UI over the audit-log API.
- A light/dark theme foundation now exists through `data-theme` styling and a shell toggle. Theme preference is stored separately from authentication state; operator/customer session tokens remain out of `localStorage`.
- Public surfaces remain separate from operator portals: `/book/:slug`, `/widget/:slug`, and `/portal` continue to operate as public/customer-facing routes.

## Current Frontend Route Inventory
- Operator/auth:
  - `/login`
  - `/forbidden`
- Owner:
  - `/owner`
  - `/owner/users`
  - `/owner/audit`
- Admin:
  - `/admin`
  - `/admin/bookings`
  - `/admin/timeline`
  - `/admin/customers`
  - `/admin/resources`
  - `/admin/settings`
  - `/admin/audit`
- Staff:
  - `/staff`
  - `/staff/timeline`
  - `/staff/customers`
- Customer/public:
  - `/portal`
  - `/book/:slug`
  - `/widget/:slug`

## Current Frontend API Modules
- `frontend/src/api/client.ts`: base API request helper, query serialization, JSON handling, cookies, CSRF headers, and normalized error codes.
- `frontend/src/api/auth.ts`: operator session, current session, logout, customer magic-link, operator invitation, and password-reset related auth calls.
- `frontend/src/api/operators.ts`: operator listing, invitation, role update, and status update calls.
- `frontend/src/api/auditLogs.ts`: audit-log listing calls.
- `frontend/src/api/bookings.ts`: booking list/detail/lifecycle/reschedule/suggestions/insights calls.
- `frontend/src/api/businesses.ts`: business profile and template calls.
- `frontend/src/api/resources.ts`: service/resource management calls.
- `frontend/src/api/customers.ts`: customer management calls.
- `frontend/src/api/publicSurfaces.ts`: public booking page and widget config calls.

## Current Frontend Gaps
- Invitation acceptance and password-reset completion have backend/API foundations, but the UI should be checked for full end-to-end coverage before calling those flows production-complete.
- Owner/admin/staff portals are route- and navigation-separated, but several role areas intentionally reuse existing operational components. More role-specific dashboards can be added after production QA confirms the current rules are correct.
- The light/dark theme foundation exists, but contrast, public-surface polish, and visual regression checks still need browser QA.
- Browser/in-app visual QA has historically been blocked in this Windows sandbox by the `CreateProcessAsUserW failed: 5` runtime issue. Full desktop/mobile browser verification remains a staging-readiness task.
- The frontend still uses hand-maintained DTOs rather than a generated API client, so API contract drift remains a risk until contract generation or stronger integration tests are added.

## Selected Initial Folder Strategy
When frontend implementation is approved, create a separate `frontend/` workspace folder instead of mixing frontend files into `src/`.

Planned high-level structure:
```text
frontend/
  src/
    app/
    api/
    auth/
    components/
    features/
      admin/
      public-booking/
      widget/
    i18n/
    layouts/
    styles/
    tokens/
    utils/
```

This folder strategy is now partially realized through the existing `frontend/` scaffold. Future structure changes should still stay approval-gated when they add new packages, auth/storage behavior, or deployment/runtime risk.

## Screens To Implement Later

### Admin And Operator App
- Login/session, dashboard, bookings, timeline, customers, resources, business settings, audit-log, and owner user-management surfaces now exist.
- Remaining admin/operator expansion should focus on production QA, role-specific dashboard refinement, notification/outbox visibility, account/profile settings, and any missing invitation/password-reset screens after route-level testing.

### Customer Portal And Public Booking Page
- `/book/:slug` is now implemented with business-branded public booking config, service/resource selection, availability inputs, customer details, suggestions, submit feedback, and portal handoff links.
- `/portal` is now implemented with customer magic-link request, token verification, isolated memory-only customer session state, booking lookup/filtering, status/history visibility, and customer cancel/reschedule actions.
- Phase 16.21 now adds explicit client-side validation, safer request defaults, booking-context handoffs, and clearer mutation-state resets on `/portal`.
- Future hardening can add a richer review step or broader portal/public feature expansion only after separate approval.

### Embeddable Widget
- `/widget/:slug` is now implemented as a compact booking entry point using `GET /businesses/public/:slug/widget`, `POST /bookings/suggestions`, and `POST /bookings`.
- The current widget foundation includes isolated iframe-first styling, narrow-container layout rules, service/resource chooser behavior, availability inputs, customer details, loading/error/empty/success states, and lightweight handoff links to `/book/:slug` and `/portal`.
- Phase 16.21 now adds stronger widget validation polish, richer handoff context to the hosted booking page and portal, and tighter compact/mobile behavior.
- Future hardening can add richer host sizing guidance or first-party non-iframe variants only after separate approval.

## Component Inventory
- App shell, sidebar navigation, top utility bar, account/session menu.
- KPI card, insight card, trend summary, utilization slice.
- Booking table, responsive booking list, sortable header, row action menu.
- Filter bar, saved-view tabs, removable filter chips, date-range controls.
- Timeline grid, resource lane, timeline card, conflict marker.
- Status chip, conflict-risk chip, lifecycle history row.
- Detail drawer, confirmation dialog, destructive-action confirmation.
- Customer profile summary, contact visibility block, booking history list.
- Service/resource picker, availability picker, time-slot button, timezone label.
- Form field, validation summary, inline error, masked phone input.
- Loading skeleton, empty state, unavailable state, error state, success state.
- Toast/notification surface for lightweight feedback.
- Public page shell, branded header, booking stepper, confirmation summary.
- Widget container, compact stepper, embedded error boundary.

## API Contract Dependencies
The frontend should depend on the existing routes rather than inventing shadow endpoints.

- Auth: `POST /auth/session`, `GET /auth/session`, `DELETE /auth/session`, `POST /auth/customer/magic-link`, `POST /auth/customer/verify`, operator invitation, operator invitation acceptance, operator password reset, operator listing, operator role update, and operator status update routes.
- Bookings: create, list, read, update, approve, reject, cancel, complete, no-show, reschedule, customer-cancel, customer-reschedule.
- Operational feeds: `GET /bookings/timeline`, `GET /bookings/insights/dashboard`, `GET /bookings/insights/cancellation-no-show`, `POST /bookings/suggestions`.
- Business setup: `/businesses`, `/businesses/templates`, `/service-resources`, `/customers`.
- Audit: `/audit-logs`.
- Public surfaces: `GET /businesses/public/:slug/booking-page`, `GET /businesses/public/:slug/widget`.

Before implementation, define frontend DTOs from the documented response envelopes:
- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { message } }`

## State And Data Rules
- Treat server data as server state; keep it in query caches with explicit query keys.
- Keep UI-only state local to screens unless multiple surfaces need it.
- Keep operator and customer session tokens out of browser persistence; any persistent-login storage change requires a separate security review.
- Use route search params for durable filters, saved views, date ranges, and pagination.
- Keep mutation feedback in-context for consequential actions such as approve, reject, cancel, complete, no-show, and reschedule.
- Do not expose more customer data than a role and screen need.
- Store only non-auth UI preferences, such as theme, in browser persistence. Auth/session tokens must remain out of `localStorage`.
- Treat CSRF tokens as session/security metadata, not durable user preferences.

## Localization And Accessibility Requirements
- Use translation-ready message keys from the first implementation slice.
- Format dates, times, durations, phone numbers, numbers, and statuses through shared display helpers.
- Keep timezone visible near booking decisions, confirmations, and timeline views.
- Use logical CSS properties where practical to reduce future RTL rework.
- Ensure keyboard access for navigation, filters, tables/lists, drawers, dialogs, timeline cards, and public booking steps.
- Pair all status and risk colors with visible text.

## Verification Plan For Future Implementation
Planning-only Phase 14 verification:
- Manual markdown review.
- Targeted documentation sync check for Phase 14 references.

Future implementation verification, after approval:
- Frontend type check.
- Frontend build.
- Frontend unit/component tests for core components and API helpers.
- Route-level smoke checks for admin, public page, portal, and widget paths.
- Browser QA with desktop and mobile screenshots.
- Accessibility smoke checks for keyboard navigation, focus visibility, labels, and color-independent status meaning.

## Approval And Fix Process Before Scaffolding
The pre-scaffold planning decisions were approved and used to create the current `frontend/` workspace. For any future frontend package, auth/storage, deployment, SSR, or widget-isolation expansion, repeat the relevant implementation-time checks:

1. Confirm the approved package candidate list still matches the first implementation slice.
2. Review current package versions, maintenance status, and security posture immediately before installation.
3. Confirm no package introduces an avoidable duplicate framework, router, test runner, CSS system, or date library.
4. Confirm in-memory token storage is still acceptable for the first slice, or stop for backend cookie-session review.
5. Confirm the static SPA deployment default and environment API base URL approach.
6. Confirm SSR/pre-rendering remains deferred.
7. Confirm iframe isolation is used for third-party widget embeds.
8. Only after these checks pass, apply the approved expansion to `frontend/`.

## Deferred Until Approval
- Adding new frontend packages beyond the approved first scaffold.
- Changing backend authentication/session behavior for the frontend.
- Changing deployment topology.
- Introducing SSR, BFF routes, generated API clients, or monorepo/package-manager restructuring.

## Resolved Planning Risks
- Frontend package adoption is approved as a candidate package set, with final versions checked immediately before install.
- Token/session storage has an approved first-slice baseline: memory only, no `localStorage`.
- Deployment topology has an approved first-slice baseline: separate static SPA with environment API base URL.
- SSR/pre-rendering is explicitly deferred for the first implementation slice.
- Widget style isolation has an approved first-slice baseline: iframe embed for third-party hosts.

## Remaining Implementation Risks
- Package versions, advisories, and maintenance status can change, so package review must be repeated before adding or upgrading dependencies.
- API DTO drift remains possible until the frontend has generated client coverage or stronger route-contract integration tests.
- Cookie-session auth now depends on correct CORS, CSRF, secure-cookie, trusted-proxy, and frontend environment configuration across local, staging, and production.
- Static SPA deployment still needs correct cache headers, fallback routing, frontend build env values, and staging smoke tests.
- Role-specific portals are functional foundations; production QA should verify every direct URL and navigation path for owner, admin, staff, customer, public booking page, and widget flows.
