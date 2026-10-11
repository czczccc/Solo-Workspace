import type { DB } from "@/lib/db";
import { weekStartISO } from "@/lib/dates";
import { projectOverviews } from "./projects";
import { completedInWeek } from "./reviews";
import { listTasks } from "./tasks";

export function weekSummary(db: DB, now = new Date()) {
  const weekStart = weekStartISO(now);
  const done = completedInWeek(db, weekStart);
  const all = listTasks(db);
  const projects = projectOverviews(db).map((p) => ({
    ...p,
    doneThisWeek: done.filter((t) => t.projectId === p.id).length,
    doing: all.filter((t) => t.projectId === p.id && t.status === "doing").length,
  }));
  return {
    weekStart,
    doneThisWeek: done.length,
    doing: all.filter((t) => t.status === "doing").length,
    blocked: all.filter((t) => t.status === "blocked").length,
    todo: all.filter((t) => t.status === "todo").length,
    projects,
  };
}
