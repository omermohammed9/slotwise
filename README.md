# Slotwise

Slotwise is a TypeScript/Node.js booking API built with Express and MongoDB (Mongoose). The project is being evolved from a basic booking API into a flexible booking platform for businesses that need reservations, appointments, services, spaces, resources, or event scheduling.

Package identity: `slotwise-api`.

Current workspace folder: `Booking System`. Target workspace folder: `Slotwise`; rename it outside this active Codex session after tools are no longer bound to the current path.

## Current Status

- Configuration hygiene is in place with `.env.example` and centralized env loading.
- Core CRUD booking flows are implemented.
- Booking passwords were removed from the domain model.
- Automated tests cover validators, selected service behavior, and controller responses.
- Admin approval and rejection flows are not implemented yet because authentication and authorization are still undefined.
- The active roadmap now plans Repository Pattern, platform features, and future admin/customer UI/UX.

## Requirements

- Node.js
- MongoDB connection string
- Hunter API key for email verification

## Configuration

Create a root `.env` file using the values documented in [`.env.example`](</C:/Users/omarz/Desktop/Booking System/.env.example>).

Required environment variables:

- `PORT`
- `MONGODB_URI`
- `HUNTER_API_KEY`

The app still falls back to `src/.env` for backward compatibility, but root `.env` is the preferred layout.

## Commands

- `npm run dev` starts the development server
- `npm run build` compiles TypeScript
- `npm test` runs the test suite

If global `npm` is broken on the machine, use:

- `.\node_modules\.bin\tsc.cmd`
- `node --test tests\*.test.js`

## Maintenance Policy

- `node_modules/` is a local dependency cache and should not be tracked as source.
- `dist/` is generated build output and should be reproducible from source.
- Root `.env` and legacy `src/.env` are runtime secrets and should not be committed.
- Preferred verification flow is compile first, then run tests.
- Lint and formatting tool selection is still deferred because global npm is broken on this machine and there is no stable repository/CI baseline yet.
- CI setup is also deferred until the project is attached to a real Git remote/provider and the npm runtime issue is resolved.
- Dependency modernization is planned as a dedicated phase: repair npm if needed, run `npm audit`, apply safe fixes, review outdated packages, update compatible packages, and handle major upgrades with migration notes.
- The normal `npm` shim is currently broken on this machine, but the bundled CLI fallback has been verified for Phase 15 audit commands. Package-changing npm commands still require explicit approval.
- Phase 15 dependency modernization is complete for the repository: audit vulnerabilities were reduced to 0, deprecated `@types/mongoose` was removed, `dotenv` was upgraded to `17.4.2`, `express` was upgraded to `5.2.1`, and `mongoose` was upgraded to `9.7.0`.
- The normal unsandboxed npm workflow now works again and was re-verified with `npm run build` and `npm test` on June 11, 2026.
- Remaining modernization work is machine-level rather than repository-level: Node `v23.6.0` is on an EOL line and upgrading to the official `v24.16.0` LTS installer is currently blocked by an administrator-only uninstall/upgrade step.
- New packages should be introduced only when they are required for security, validation, logging, testing, API documentation, configuration safety, or future frontend implementation.

## API Base Path

All routes are mounted under `/bookings`.

## Preferred REST Routes

- `POST /bookings`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id`
- `PUT /bookings/:id`
- `DELETE /bookings/:id`

## Legacy Routes Still Supported

- `POST /bookings/createbookings`
- `GET /bookings/all`
- `GET /bookings/get/:id`
- `PUT /bookings/update/:id`
- `DELETE /bookings/delete/:id`

## Example Create Request

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "fName": "Jane",
  "lName": "Doe",
  "gender": "female",
  "email": "jane@example.com",
  "phone": "+14155552671",
  "startDate": "2030-01-02T00:00:00.000Z",
  "endDate": "2030-01-03T00:00:00.000Z",
  "timein": "2030-01-02T09:00:00.000Z",
  "timeout": "2030-01-03T10:00:00.000Z",
  "status": "pending"
}
```

## Example Partial Update Request

```json
{
  "status": "approved"
}
```

## Response Notes

- Missing bookings return `404`.
- Successful delete returns `204` with no response body.
- Email verification runs on create and when `email` is explicitly updated.

## Known Gaps

- Availability currently checks only `startDate` and `endDate`, not `timein` and `timeout`.
- Admin approval/rejection endpoints are deferred until auth scope is defined.
- Existing database records may still contain historical `password` fields and need a separate cleanup/migration decision.
- Source folders/files now use professional dot-case naming for booking routes, controller, service, model, and interface files.
- Frontend implementation is deferred until the UI/UX brief, auth model, and API roadmap are approved.
- The remaining repository-folder rename is tracked in the implementation plan and should be handled only after workspace path risk is accepted.

## Roadmap

- Professional source naming and repository-layer architecture.
- Full date-time availability, booking lifecycle, filtering, pagination, audit trail, validation, and standard responses.
- Business profiles, services/resources, configurable availability, customers, notifications, rescheduling, and role model.
- Professional admin dashboard and customer booking portal after UI/UX planning is approved.
- Dependency audit, vulnerability fixes, package updates, and justified modern package adoption.
