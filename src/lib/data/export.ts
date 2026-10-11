import fs from "node:fs";
import path from "node:path";
import type { DB } from "@/lib/db";
import * as s from "@/lib/db/schema";

export const EXPORT_VERSION = 1;

export function exportAll(db: DB) {
  return {
    app: "solo-workspace",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      projects: db.select().from(s.projects).all(),
      milestones: db.select().from(s.milestones).all(),
      tasks: db.select().from(s.tasks).all(),
      subtasks: db.select().from(s.subtasks).all(),
      inboxItems: db.select().from(s.inboxItems).all(),
      weeklyReviews: db.select().from(s.weeklyReviews).all(),
      weeklyProjectMetrics: db.select().from(s.weeklyProjectMetrics).all(),
    },
  };
}

export function backupDir() {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), "data", "backups");
}

function stamp(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Consistent online backup of the SQLite database. Returns the backup file path. */
export async function backupDatabase(db: DB, dir = backupDir()) {
  fs.mkdirSync(/*turbopackIgnore: true*/ dir, { recursive: true });
  const file = path.join(/*turbopackIgnore: true*/ dir, `solo-workspace-${stamp()}.sqlite`);
  await db.$client.backup(file);
  return file;
}

/** Keep only the newest `keep` backups. */
export function pruneBackups(dir = backupDir(), keep = Number(process.env.BACKUP_KEEP ?? 14)) {
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return [];
  const files = fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => /^solo-workspace-\d{8}-\d{6}\.sqlite$/.test(f))
    .sort()
    .reverse();
  const removed = files.slice(Math.max(keep, 1));
  for (const f of removed) fs.rmSync(path.join(/*turbopackIgnore: true*/ dir, f));
  return removed;
}
