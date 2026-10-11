import { getSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { exportAll } from "@/lib/data/export";
import { todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getSession())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = JSON.stringify(exportAll(getDb()), null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="solo-workspace-${todayISO()}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
