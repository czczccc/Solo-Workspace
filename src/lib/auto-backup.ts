import { getDb } from "@/lib/db";
import { backupDatabase, pruneBackups } from "@/lib/data/export";

export function startAutoBackup(hours: number) {
  const run = async () => {
    try {
      const file = await backupDatabase(getDb());
      pruneBackups();
      console.log(`[backup] wrote ${file}`);
    } catch (err) {
      console.error("[backup] failed", err);
    }
  };
  // First backup a minute after boot, then on the interval.
  setTimeout(run, 60_000).unref();
  setInterval(run, hours * 3_600_000).unref();
}
