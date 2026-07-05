# Slotwise Migration Workflow

Slotwise uses an explicit migration registry for database discipline. Each migration has a stable id and is recorded in the `migrationstates` collection after it succeeds, so already-applied migrations are skipped on later deploys.

```powershell
npm run migrate:status
npm run migrate:dry-run
npm run migrate
```

The migration registry currently includes the initial core index synchronization and a follow-up booking index sync for business-scoped list reads. Run `migrate:dry-run` in CI/staging to see pending work, then `migrate` during deployment before starting new API/worker processes.

Required indexed surfaces include operator accounts, auth sessions, verification tokens, businesses, bookings, customers, service resources, notification jobs, and audit logs. New schema/index changes should be added as new registry entries instead of editing historical migration ids.

Production must not rely on env-backed operator bootstrap. Use local/test bootstrap only for disposable development databases. Production owner accounts should be created through the controlled first-owner setup path, then managed through owner-controlled invitations and account administration.
