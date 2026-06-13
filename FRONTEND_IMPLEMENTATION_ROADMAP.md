# Slotwise Frontend Implementation Roadmap

## Purpose
This document is the Phase 14 planning and selection artifact for the future Slotwise frontend. It selects an implementation direction and lists the components, screens, API contracts, and verification expectations needed before any frontend packages or source app are added.

No frontend source code, package installation, package update, deployment configuration, or auth/security implementation is part of this phase.

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
- Current scaffold coverage is intentionally narrow: app shell, static admin dashboard examples, API envelope foundation, memory-only session store, and smoke tests.
- Route-map/app-shell routing is complete with central route metadata, shell links, admin route placeholders, public-surface routes, responsive styling, and route navigation tests.
- The next implementation slice is shared API DTO/client modules before auth-sensitive screens.
- All Phase 16 UI work must stay reusable, responsive, minimal, and aligned with `UI_UX_DESIGN_BRIEF.md`; auth/session and lifecycle-action screens remain high-reasoning approval gates.

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

This is a plan only. Creating the folder, adding package metadata, and installing dependencies remain future approval-gated tasks.

## Screens To Implement Later

### Admin And Operator App
- Login/session screen.
- Dashboard home with KPI strip, pending approvals, today timeline snapshot, and exception summaries.
- Bookings workspace with filters, saved views, table/list, quick actions, and detail drawer.
- Timeline view with day/week mode, resource grouping, status chips, conflict-risk indicators, and drill-in details.
- Booking detail page or drawer with customer identity, booking window, notes, risk signals, status history, and lifecycle actions.
- Customers list and customer profile with booking history.
- Resources/services management.
- Business settings with working hours, blackout dates, templates, notification preferences, widget settings, and public-page settings.
- Activity/notification center for recent booking changes and outbox-related feedback.

### Customer Portal And Public Booking Page
- Business-branded public booking page using `GET /businesses/public/:slug/booking-page`.
- Service/resource chooser.
- Availability picker with timezone and duration context.
- Customer details form with inline validation and review step.
- Confirmation screen with booking summary and next steps.
- Customer magic-link entry and verification flow.
- Booking management view for status, reschedule, and cancellation.

### Embeddable Widget
- Compact booking entry point using `GET /businesses/public/:slug/widget`.
- Narrow-container layout rules.
- Service/resource chooser, availability picker, customer details, and confirmation states.
- Host-page isolation strategy for styles and predictable sizing.

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
The future frontend should depend on the existing routes rather than inventing shadow endpoints.

- Auth: `POST /auth/session`, `GET /auth/session`, `DELETE /auth/session`, `POST /auth/customer/magic-link`, `POST /auth/customer/verify`.
- Bookings: create, list, read, update, approve, reject, cancel, complete, no-show, reschedule, customer-cancel, customer-reschedule.
- Operational feeds: `GET /bookings/timeline`, `GET /bookings/insights/dashboard`, `GET /bookings/insights/cancellation-no-show`, `POST /bookings/suggestions`.
- Business setup: `/businesses`, `/businesses/templates`, `/service-resources`, `/customers`.
- Public surfaces: `GET /businesses/public/:slug/booking-page`, `GET /businesses/public/:slug/widget`.

Before implementation, define frontend DTOs from the documented response envelopes:
- Success: `{ success: true, data, meta? }`
- Error: `{ success: false, error: { message } }`

## State And Data Rules
- Treat server data as server state; keep it in query caches with explicit query keys.
- Keep UI-only state local to screens unless multiple surfaces need it.
- Store bearer session tokens carefully; final storage choice requires security review before implementation.
- Use route search params for durable filters, saved views, date ranges, and pagination.
- Keep mutation feedback in-context for consequential actions such as approve, reject, cancel, complete, no-show, and reschedule.
- Do not expose more customer data than a role and screen need.

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
- Route-level smoke checks for admin, public page, and widget paths.
- Browser QA with desktop and mobile screenshots.
- Accessibility smoke checks for keyboard navigation, focus visibility, labels, and color-independent status meaning.

## Approval And Fix Process Before Scaffolding
The pre-scaffold planning decisions are approved. Before `frontend/` is created or any frontend package is installed, run this implementation-time checklist:

1. Confirm the approved package candidate list still matches the first implementation slice.
2. Review current package versions, maintenance status, and security posture immediately before installation.
3. Confirm no package introduces an avoidable duplicate framework, router, test runner, CSS system, or date library.
4. Confirm in-memory token storage is still acceptable for the first slice, or stop for backend cookie-session review.
5. Confirm the static SPA deployment default and environment API base URL approach.
6. Confirm SSR/pre-rendering remains deferred.
7. Confirm iframe isolation is used for third-party widget embeds.
8. Only after these checks pass, scaffold `frontend/` and add baseline scripts.

## Deferred Until Approval
- Creating `frontend/` source files.
- Adding React, Vite, router, query, styling, form, chart, date-picker, icon, test, or accessibility packages.
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
- Package versions, advisories, and maintenance status can change before installation, so the package review must be repeated immediately before adding dependencies.
- API DTO drift remains possible until the frontend has typed contracts or generated client coverage.
- In-memory token storage prioritizes XSS risk reduction but requires users to re-authenticate after refresh; persistent login requires a later backend cookie-session design.
- Static SPA deployment needs correct API CORS, environment configuration, cache headers, and fallback routing when implemented.
