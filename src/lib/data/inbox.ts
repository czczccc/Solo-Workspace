import { desc, eq } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { inboxItems, type InboxStatus, type TaskPriority } from "@/lib/db/schema";
import { createTask } from "./tasks";

export function listInbox(db: DB, status: InboxStatus = "open") {
  return db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.status, status))
    .orderBy(desc(inboxItems.createdAt), desc(inboxItems.id))
    .all();
}

export function addInboxItem(db: DB, content: string) {
  return db.insert(inboxItems).values({ content }).returning().get();
}

export function setInboxStatus(db: DB, id: number, status: InboxStatus) {
  return db
    .update(inboxItems)
    .set({ status, processedAt: status === "open" ? null : new Date() })
    .where(eq(inboxItems.id, id))
    .returning()
    .get();
}

export function deleteInboxItem(db: DB, id: number) {
  db.delete(inboxItems).where(eq(inboxItems.id, id)).run();
}

/** Turn an inbox idea into a task. First line becomes the title, the rest the description. */
export function convertInboxItem(
  db: DB,
  id: number,
  opts: { projectId?: number | null; priority?: TaskPriority; title?: string; dueDate?: string | null; isFocus?: boolean } = {},
) {
  return db.transaction((tx) => {
    const item = tx.select().from(inboxItems).where(eq(inboxItems.id, id)).get();
    if (!item || item.status === "converted") return null;
    const [firstLine, ...rest] = item.content.trim().split("\n");
    const task = createTask(tx as unknown as DB, {
      title: (opts.title?.trim() || firstLine).slice(0, 200),
      description: rest.join("\n").trim(),
      projectId: opts.projectId ?? null,
      priority: opts.priority ?? "medium",
      dueDate: opts.dueDate ?? null,
      isFocus: opts.isFocus ?? false,
    });
    tx.update(inboxItems)
      .set({ status: "converted", taskId: task.id, processedAt: new Date() })
      .where(eq(inboxItems.id, id))
      .run();
    return task;
  });
}
