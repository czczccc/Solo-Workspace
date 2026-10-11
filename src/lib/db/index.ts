import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import { seedDefaults } from "./seed";

export type DB = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

export function migrationsDir() {
  return process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
}

/** Open (or create) a database, apply migrations and seed defaults. */
export function createDb(file: string): DB {
  if (file !== ":memory:") {
    fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(path.resolve(file)), { recursive: true });
  }
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema }) as DB;
  migrate(db, { migrationsFolder: migrationsDir() });
  seedDefaults(db);
  return db;
}

export function databasePath() {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "solo.db");
}

const globalForDb = globalThis as unknown as { __soloDb?: DB };

/** Process-wide database handle (reused across hot reloads in dev). */
export function getDb(): DB {
  if (!globalForDb.__soloDb) {
    globalForDb.__soloDb = createDb(databasePath());
  }
  return globalForDb.__soloDb;
}

export { schema };
