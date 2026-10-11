export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const hours = Number(process.env.AUTO_BACKUP_HOURS ?? 24);
  if (!(hours > 0) || process.env.NODE_ENV !== "production") return;
  const { startAutoBackup } = await import("./lib/auto-backup");
  startAutoBackup(hours);
}
