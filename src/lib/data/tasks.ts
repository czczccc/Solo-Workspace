import { and, asc, eq, inArray, max, ne } from "drizzle-orm";
import type { DB } from "@/lib/db";
import {
  projects,
  subtasks,
  tasks,
  TASK_PRIORITIES,
  type Subtask,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/db/schema";

export type TaskWithMeta = Task & {
  subtasks: Subtask[];
  project: { id: number; name: string; slug: string; color: string } | null;
};

export type TaskInput = {
  title: string;
  description?: string;
  projectId?: number | null;
  milestoneId?: number | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  isFocus?: boolean;
};

export const PRIORITY_RANK: Record<TaskPriority, number> = Object.fromEntries(
  TASK_PRIORITIES.map((p, i) => [p, i]),
) as Record<TaskPriority, number>;

function attachMeta(db: DB, rows: Task[]): TaskWithMeta[] {
  if (rows.length === 0) return [];
  const ids = rows.map((t) => t.id);
  const subs = db
    .select()
    .from(subtasks)
    .where(inArray(subtasks.taskId, ids))
    .orderBy(asc(subtasks.sortOrder), asc(subtasks.id))
    .all();
  const projectRows = db
    .select({ id: projects.id, name: projects.name, slug: projects.slug, color: projects.color })
    .from(projects)
    .all();
  const projectById = new Map(projectRows.map((p) => [p.id, p]));
  return rows.map((t) => ({
    ...t,
    subtasks: subs.filter((s) => s.taskId === t.id),
    project: t.projectId ? (projectById.get(t.projectId) ?? null) : null,
  }));
}

export function listTasks(
  db: DB,
  filter: { projectId?: number; priority?: TaskPriority; status?: TaskStatus } = {},
) {
  const conds = [];
  if (filter.projectId) conds.push(eq(tasks.projectId, filter.projectId));
  if (filter.priority) conds.push(eq(tasks.priority, filter.priority));
  if (filter.status) conds.push(eq(tasks.status, filter.status));
  const rows = db
    .select()
    .from(tasks)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(tasks.sortOrder), asc(tasks.id))
    .all();
  return attachMeta(db, rows);
}

export function getTask(db: DB, id: number) {
  const row = db.select().from(tasks).where(eq(tasks.id, id)).get();
  return row ? attachMeta(db, [row])[0] : null;
}

function nextSortOrder(db: DB, status: TaskStatus) {
  const [{ m }] = db
    .select({ m: max(tasks.sortOrder) })
    .from(tasks)
    .where(eq(tasks.status, status))
    .all();
  return (m ?? -1) + 1;
}

export function createTask(db: DB, input: TaskInput) {
  const status = input.status ?? "todo";
  const row = db
    .insert(tasks)
    .values({
      title: input.title,
      description: input.description ?? "",
      projectId: input.projectId ?? null,
      milestoneId: input.milestoneId ?? null,
      status,
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      isFocus: input.isFocus ?? false,
      sortOrder: nextSortOrder(db, status),
      completedAt: status === "done" ? new Date() : null,
    })
    .returning()
    .get();
  return row;
}

export function updateTask(db: DB, id: number, patch: Partial<TaskInput>) {
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) return null;
  const values: Partial<Task> = { updatedAt: new Date() };
  if (patch.title !== undefined) values.title = patch.title;
  if (patch.description !== undefined) values.description = patch.description;
  if (patch.projectId !== undefined) values.projectId = patch.projectId;
  if (patch.milestoneId !== undefined) values.milestoneId = patch.milestoneId;
  if (patch.priority !== undefined) values.priority = patch.priority;
  if (patch.dueDate !== undefined) values.dueDate = patch.dueDate;
  if (patch.isFocus !== undefined) values.isFocus = patch.isFocus;
  if (patch.status !== undefined && patch.status !== current.status) {
    Object.assign(values, statusChange(db, current, patch.status));
  }
  return db.update(tasks).set(values).where(eq(tasks.id, id)).returning().get();
}

function statusChange(db: DB, current: Task, status: TaskStatus): Partial<Task> {
  return {
    status,
    sortOrder: nextSortOrder(db, status),
    completedAt: status === "done" ? (current.completedAt ?? new Date()) : null,
    // Finishing a task clears its "today" star.
    isFocus: status === "done" ? false : current.isFocus,
  };
}

/** Move a task to `status` at position `index` within that column. */
export function moveTask(db: DB, id: number, status: TaskStatus, index?: number) {
  return db.transaction((tx) => {
    const current = tx.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!current) return null;
    if (current.status !== status) {
      tx.update(tasks)
        .set({ ...statusChange(tx as unknown as DB, current, status), updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .run();
    }
    if (index !== undefined) {
      const column = tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.status, status), ne(tasks.id, id)))
        .orderBy(asc(tasks.sortOrder), asc(tasks.id))
        .all()
        .map((r) => r.id);
      column.splice(Math.max(0, Math.min(index, column.length)), 0, id);
      column.forEach((taskId, i) => {
        tx.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, taskId)).run();
      });
    }
    return tx.select().from(tasks).where(eq(tasks.id, id)).get() ?? null;
  });
}

export function deleteTask(db: DB, id: number) {
  db.delete(tasks).where(eq(tasks.id, id)).run();
}

export function addSubtask(db: DB, taskId: number, title: string) {
  const [{ m }] = db
    .select({ m: max(subtasks.sortOrder) })
    .from(subtasks)
    .where(eq(subtasks.taskId, taskId))
    .all();
  return db
    .insert(subtasks)
    .values({ taskId, title, sortOrder: (m ?? -1) + 1 })
    .returning()
    .get();
}

export function setSubtaskDone(db: DB, id: number, done: boolean) {
  return db.update(subtasks).set({ done }).where(eq(subtasks.id, id)).returning().get();
}

export function renameSubtask(db: DB, id: number, title: string) {
  return db.update(subtasks).set({ title }).where(eq(subtasks.id, id)).returning().get();
}

export function deleteSubtask(db: DB, id: number) {
  db.delete(subtasks).where(eq(subtasks.id, id)).run();
}

export function compareByUrgency(a: Task, b: Task, today: string) {
  const overdueA = a.dueDate && a.dueDate < today ? 0 : 1;
  const overdueB = b.dueDate && b.dueDate < today ? 0 : 1;
  if (overdueA !== overdueB) return overdueA - overdueB;
  const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (pr !== 0) return pr;
  return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
}

/** Today's focus: unfinished tasks that are starred or due today / overdue. */
export function focusTasks(db: DB, today: string) {
  const open = listTasks(db).filter((t) => t.status !== "done");
  return open
    .filter((t) => t.isFocus || (t.dueDate !== null && t.dueDate <= today))
    .sort((a, b) => compareByUrgency(a, b, today));
}
