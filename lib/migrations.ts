import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";

import { db } from "@/lib/db";

const MIGRATION_FILE_PATTERN = /^\d{3}_[a-z0-9_]+\.sql$/;
const MIGRATION_LOCK_ID = 917_202_609;

type AppliedMigration = {
  name: string;
  checksum: string;
};

type MigrationFile = AppliedMigration & {
  sql: string;
};

const globalForMigrations = globalThis as typeof globalThis & {
  databaseMigrationPromise?: Promise<void>;
};

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDirectory = path.join(process.cwd(), "db", "migrations");
  const names = (await readdir(migrationsDirectory))
    .filter((name) => MIGRATION_FILE_PATTERN.test(name))
    .sort((left, right) => left.localeCompare(right));

  if (names.length === 0) {
    throw new Error(`No database migrations found in ${migrationsDirectory}`);
  }

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(path.join(migrationsDirectory, name), "utf8");

      return {
        name,
        sql,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

async function applyMigration(client: PoolClient, migration: MigrationFile) {
  await client.query("BEGIN");

  try {
    await client.query(migration.sql);
    await client.query(
      "INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)",
      [migration.name, migration.checksum],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw new Error(`Database migration ${migration.name} failed`, {
      cause: error,
    });
  }
}

async function migrateDatabase() {
  const migrations = await loadMigrationFiles();
  const client = await db.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const result = await client.query<AppliedMigration>(
      "SELECT name, checksum FROM schema_migrations ORDER BY name ASC",
    );
    const appliedMigrations = new Map(
      result.rows.map((migration) => [migration.name, migration.checksum]),
    );

    for (const migration of migrations) {
      const appliedChecksum = appliedMigrations.get(migration.name);

      if (appliedChecksum && appliedChecksum !== migration.checksum) {
        throw new Error(
          `Database migration ${migration.name} has changed since it was applied. Create a new migration instead of editing it.`,
        );
      }

      if (appliedChecksum) {
        continue;
      }

      await applyMigration(client, migration);
      console.info(`[database] Applied migration ${migration.name}`);
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID])
      .catch(() => undefined);
    client.release();
  }
}

export function runMigrations() {
  globalForMigrations.databaseMigrationPromise ??= migrateDatabase();
  return globalForMigrations.databaseMigrationPromise;
}
