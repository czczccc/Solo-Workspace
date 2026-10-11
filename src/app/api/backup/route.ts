import fs from "node:fs";
import path from "node:path";
import { getSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { backupDatabase, pruneBackups } from "@/lib/data/export";

export const dynamic = "force-dynamic";

/** Create a consistent SQLite backup on the server and stream it to the browser. */
export async function GET() {
  if (!(await getSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const file = await backupDatabase(getDb());
  pruneBackups();
  const data = fs.readFileSync(/*turbopackIgnore: true*/ file);
  return new Response(data, {
    headers: {
      "Content-Type": "application/vnd.sqlite3",
      "Content-Disposition": `attachment; filename="${path.basename(file)}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}
