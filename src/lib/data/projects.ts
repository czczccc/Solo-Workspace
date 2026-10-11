import { and, asc, eq, max } from "drizzle-orm";
import type { DB } from "@/lib/db";
import {
  milestones,
  projects,
  tasks,
  type Milestone,
  type MilestoneStatus,
  type Project,
} from "@/lib/db/schema";

export type ProjectInput = {
  name: string;
  description?: string;
  goal?: string;
  color?: string;
};

export function listProjects(db: DB, opts: { includeArchived?: boolean } = {}) {
  return db
    .select()
    .from(projects)
    .where(opts.includeArchived ? undefined : eq(projects.archived, false))
    .orderBy(asc(projects.sortOrder), asc(projects.id))
    .all();
}

export function getProjectBySlug(db: DB, slug: string) {
  return db.select().from(projects).where(eq(projects.slug, slug)).get() ?? null;
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function uniqueSlug(db: DB, base: string) {
  const root = base || "project";
  let slug = root;
  for (let i = 2; getProjectBySlug(db, slug); i++) slug = `${root}-${i}`;
  return slug;
}

export function createProject(db: DB, input: ProjectInput) {
  const [{ m }] = db.select({ m: max(projects.sortOrder) }).from(projects).all();
  return db
    .insert(projects)
    .values({
      slug: uniqueSlug(db, slugify(input.name)),
      name: input.name,
      description: input.description ?? "",
      goal: input.goal ?? "",
      color: input.color ?? "#6366f1",
      sortOrder: (m ?? -1) + 1,
    })
    .returning()
    .get();
}

export function updateProject(db: DB, id: number, patch: Partial<ProjectInput> & { archived?: boolean }) {
  return db
    .update(projects)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning()
    .get();
}

export function listMilestones(db: DB, projectId?: number) {
  return db
    .select()
    .from(milestones)
    .where(projectId ? eq(milestones.projectId, projectId) : undefined)
    .orderBy(asc(milestones.sortOrder), asc(milestones.id))
    .all();
}

export function createMilestone(db: DB, projectId: number, title: string, dueDate: string | null) {
  const [{ m }] = db
    .select({ m: max(milestones.sortOrder) })
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .all();
  return db
    .insert(milestones)
    .values({ projectId, title, dueDate, sortOrder: (m ?? -1) + 1 })
    .returning()
    .get();
}

export function updateMilestone(
  db: DB,
  id: number,
  patch: { title?: string; dueDate?: string | null; status?: MilestoneStatus },
) {
  const values: Partial<Milestone> = { ...patch };
  if (patch.status) values.completedAt = patch.status === "done" ? new Date() : null;
  return db.update(milestones).set(values).where(eq(milestones.id, id)).returning().get();
}

export function deleteMilestone(db: DB, id: number) {
  db.delete(milestones).where(eq(milestones.id, id)).run();
}

/** The milestone currently being worked on: first active, else first planned. */
export function currentMilestone(list: Milestone[]) {
  return list.find((m) => m.status === "active") ?? list.find((m) => m.status === "planned") ?? null;
}

export type ProjectOverview = Project & {
  total: number;
  done: number;
  open: number;
  blocked: number;
  milestones: Milestone[];
  current: Milestone | null;
};

export function projectOverviews(db: DB, opts: { includeArchived?: boolean } = {}): ProjectOverview[] {
  const list = listProjects(db, opts);
  const allTasks = db.select({ projectId: tasks.projectId, status: tasks.status }).from(tasks).all();
  const allMilestones = listMilestones(db);
  return list.map((p) => {
    const mine = allTasks.filter((t) => t.projectId === p.id);
    const ms = allMilestones.filter((m) => m.projectId === p.id);
    return {
      ...p,
      total: mine.length,
      done: mine.filter((t) => t.status === "done").length,
      open: mine.filter((t) => t.status !== "done").length,
      blocked: mine.filter((t) => t.status === "blocked").length,
      milestones: ms,
      current: currentMilestone(ms),
    };
  });
}

export function milestoneProgress(db: DB, milestoneId: number) {
  const rows = db
    .select({ status: tasks.status })
    .from(tasks)
    .where(and(eq(tasks.milestoneId, milestoneId)))
    .all();
  return { total: rows.length, done: rows.filter((r) => r.status === "done").length };
}
