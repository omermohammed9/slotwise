# System Map

## Runtime Flow
```text
Client
  -> Express app (`src/app.ts`)
  -> Env helper (`src/config/env.ts`)
  -> Booking router (`src/routes/booking.routes.ts`)
  -> BookingController (`src/controllers/booking.controller.ts`)
  -> BookingService (`src/services/booking.service.ts`)
     -> Hunter API (`src/utils/emailVerifier.ts`)
     -> Mongoose Booking model (`src/models/booking.model.ts`)
  -> MongoDB

Tests
  -> Node built-in test runner (`node --test`)
  -> Compiled runtime output in `dist/`
  -> Validator, controller, and service verification

Maintenance
  -> `.gitignore` excludes generated output, dependencies, IDE files, and secrets
  -> `.editorconfig` defines shared editor defaults
```

## Planned Slotwise Architecture
```text
Client / Future Frontend
  -> Express routes
  -> Thin controllers
  -> Services for business rules
  -> Repositories for persistence
  -> Mongoose models
  -> MongoDB
```

## Entry Points
- HTTP server: `src/app.ts`
- Environment helper: `src/config/env.ts`
- Booking API base path: `/bookings`
- Database connection: `src/config/db.ts`
- Test entry points: `tests/validators.test.js`, `tests/bookingService.test.js`, `tests/bookingController.test.js`
- Route test entry point: `tests/bookingRoutes.test.js`

## Routes
- Preferred REST aliases:
  - `POST /bookings`
  - `GET /bookings`
  - `GET /bookings/:id`
  - `PATCH /bookings/:id`
  - `PUT /bookings/:id`
  - `DELETE /bookings/:id`
- `POST /bookings/createbookings`
- `GET /bookings/all`
- `GET /bookings/get/:id`
- `PUT /bookings/update/:id`
- `DELETE /bookings/delete/:id`

## External Dependencies
- MongoDB via `MONGODB_URI`
- Hunter email verifier via `HUNTER_API_KEY`

## Package Maintenance Surface
- Runtime packages: `axios`, `dotenv`, `express`, `libphonenumber-js`, `mongoose`, `validator`.
- Development packages: `@types/express`, `@types/validator`, `nodemon`, `ts-node`.
- Phase 15 was executed through the bundled npm CLI fallback because the normal `npm` shim is broken on this machine.
- Current direct version targets declared in `package.json`: `axios@^1.17.0`, `dotenv@^17.4.2`, `express@^5.2.1`, `libphonenumber-js@^1.13.6`, `mongoose@^9.7.0`, `validator@^13.15.35`, `@types/express@^5.0.6`, `@types/validator@^13.15.10`, `nodemon@^3.1.14`, `ts-node@^10.9.2`.
- The initial audit reported 17 vulnerabilities, and the final audit result is now 0 vulnerabilities.
- Deprecated `@types/mongoose` has been removed.
- `dotenv` was upgraded to `17.4.2` with an explicit quiet-mode workaround in `src/config/env.ts`.
- `express` was upgraded to `5.2.1` with `@types/express` `5.0.6`.
- `mongoose` was upgraded to `9.7.0`, with small type-compatibility adjustments in `src/interfaces/booking.interface.ts` and `src/utils/validators.ts`.
- Remaining package-health issues are machine-level toolchain concerns rather than repository dependency gaps: Node `v23.6.0` is on an EOL line, normal npm now works at `11.16.0` outside the sandbox, and the Node 24 LTS installer is blocked by an administrator-only uninstall/upgrade step.
- Candidate future packages must be justified before adoption and documented here after approval.

## Instruction Sources
Codex-specific governance should live in `.codex/`. If `.agents/` exists, treat it as legacy or secondary unless the user explicitly says otherwise.

## Planned System Changes
- Product identity is now Slotwise.
- Package identity is now `slotwise-api`.
- Repository folder is planned to be renamed from `Booking System` to `Slotwise`.
- The root folder rename remains an external/manual workspace action because this Codex session is bound to the current `Booking System` path.
- Source file/folder naming now uses professional dot-case conventions for booking routes, controller, service, model, and interface files.
- A booking repository layer is planned so services no longer call Mongoose models directly.
- Configuration now prefers root `.env` and temporarily falls back to `src/.env`.
- Required env vars are validated before MongoDB and Hunter API usage.
- Booking update flow verifies email only when email is being changed.
- Booking get/update/delete flows return `404` when the target booking is missing.
- Booking delete returns an empty `204` when deletion succeeds.
- Booking documents no longer define a password field; schema serialization strips legacy `password` values if present.
- Phone validation now returns explicit booleans for valid and invalid input.
- Admin approval/rejection flows remain intentionally undefined until auth scope is designed.
- Lint/format tooling and CI remain deferred until npm and repository hosting are in a healthier state.
- Mandatory platform features are planned: full date-time availability, booking lifecycle expansion, admin flows, filtering, pagination, audit trail, request validation, and standard responses.
- Professional business features are planned: business profiles, service/resources, working hours, customer records, notifications, rescheduling, and roles.
- Frontend planning is now split into a UI/UX design brief first, followed by a deferred implementation roadmap for admin and customer portals.
- Dependency modernization is planned as Phase 15, including npm repair, vulnerability fixes, package updates, obsolete package removal, and carefully justified modern package additions.
