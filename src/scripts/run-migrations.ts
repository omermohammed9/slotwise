import mongoose from "mongoose";
import { connectDB } from "../config/db";
import "../models/audit-log.model";
import "../models/auth-session.model";
import "../models/booking.model";
import "../models/business-profile.model";
import "../models/customer.model";
import migrationStateModel from "../models/migration-state.model";
import "../models/operator-account.model";
import "../models/service-resource.model";
import "../models/verification-token.model";

type Migration = {
    id: string;
    description: string;
    run: () => Promise<void>;
};

export const migrations: Migration[] = [
    {
        id: "20260616-sync-core-indexes",
        description: "Synchronize indexes for operator accounts, sessions, verification tokens, businesses, bookings, customers, resources, and audit logs",
        run: async () => {
            const models = Object.values(mongoose.models).filter((model) => model.modelName !== "MigrationState");
            await Promise.all(models.map((model) => model.syncIndexes()));
        },
    },
];

export const getMigrationStatus = async (): Promise<Array<Migration & { applied: boolean; appliedAt?: Date }>> => {
    const appliedStates = await migrationStateModel.find({
        migrationId: { $in: migrations.map((migration) => migration.id) },
    });
    const appliedById = new Map(appliedStates.map((state) => [state.migrationId, state.appliedAt]));

    return migrations.map((migration) => ({
        ...migration,
        applied: appliedById.has(migration.id),
        appliedAt: appliedById.get(migration.id),
    }));
};

export const runPendingMigrations = async (options: { dryRun?: boolean } = {}): Promise<Array<{ id: string; status: "pending" | "applied" | "skipped" }>> => {
    const status = await getMigrationStatus();
    const results: Array<{ id: string; status: "pending" | "applied" | "skipped" }> = [];

    for (const migration of status) {
        if (migration.applied) {
            results.push({ id: migration.id, status: "skipped" });
            continue;
        }

        if (options.dryRun) {
            results.push({ id: migration.id, status: "pending" });
            continue;
        }

        await migration.run();
        await migrationStateModel.create({
            migrationId: migration.id,
            description: migration.description,
            appliedAt: new Date(),
        });
        results.push({ id: migration.id, status: "applied" });
    }

    return results;
};

const runMigrations = async () => {
    const mode = process.argv.includes("--status")
        ? "status"
        : process.argv.includes("--dry-run")
            ? "dry-run"
            : "run";

    await connectDB();
    const results = mode === "status"
        ? await getMigrationStatus()
        : await runPendingMigrations({ dryRun: mode === "dry-run" });

    await mongoose.disconnect();
    console.log(JSON.stringify({ mode, migrations: results }, null, 2));
};

if (require.main === module) {
    runMigrations().catch(async (error) => {
        console.error("Migration failed:", error instanceof Error ? error.message : error);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    });
}
