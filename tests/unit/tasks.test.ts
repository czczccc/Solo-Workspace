import { describe, expect, it } from "vitest";
import { addSubtask, createTask, deleteTask, focusTasks, getTask, listTasks, moveTask, setSubtaskDone, updateTask } from "@/lib/data/tasks";
import { memoryDb } from "./helpers";

describe("tasks", () => {
  it("sets and clears completedAt as status changes", () => {
    const db = memoryDb();
    const t = createTask(db, { title: "A", isFocus: true });
    expect(t.completedAt).toBeNull();
    const done = updateTask(db, t.id, { status: "done" })!;
    expect(done.completedAt).toBeInstanceOf(Date);
    expect(done.isFocus).toBe(false);
    const reopened = updateTask(db, t.id, { status: "doing" })!;
    expect(reopened.completedAt).toBeNull();
  });

  it("moves a task to a column position and renumbers", () => {
    const db = memoryDb();
    const a = createTask(db, { title: "a" });
    const b = createTask(db, { title: "b" });
    const c = createTask(db, { title: "c", status: "doing" });
    moveTask(db, c.id, "todo", 0);
    expect(listTasks(db, { status: "todo" }).map((t) => t.title)).toEqual(["c", "a", "b"]);
    moveTask(db, a.id, "todo", 5);
    expect(listTasks(db, { status: "todo" }).map((t) => t.title)).toEqual(["c", "b", "a"]);
    expect(b.status).toBe("todo");
  });

  it("filters by project and priority", () => {
    const db = memoryDb();
    createTask(db, { title: "x", projectId: 1, priority: "high" });
    createTask(db, { title: "y", projectId: 2, priority: "high" });
    createTask(db, { title: "z", projectId: 1, priority: "low" });
    expect(listTasks(db, { projectId: 1 }).map((t) => t.title)).toEqual(["x", "z"]);
    expect(listTasks(db, { projectId: 1, priority: "high" }).map((t) => t.title)).toEqual(["x"]);
    expect(listTasks(db)[0].project?.slug).toBe("ai-drama");
  });

  it("tracks subtasks and cascades on delete", () => {
    const db = memoryDb();
    const t = createTask(db, { title: "parent" });
    const s1 = addSubtask(db, t.id, "one");
    addSubtask(db, t.id, "two");
    setSubtaskDone(db, s1.id, true);
    const full = getTask(db, t.id)!;
    expect(full.subtasks.map((s) => [s.title, s.done])).toEqual([["one", true], ["two", false]]);
    deleteTask(db, t.id);
    expect(db.$client.prepare("select count(*) n from subtasks").get()).toEqual({ n: 0 });
  });

  it("picks today's focus: starred or due today/overdue, overdue first", () => {
    const db = memoryDb();
    createTask(db, { title: "starred", isFocus: true, priority: "low" });
    createTask(db, { title: "due today", dueDate: "2026-10-11", priority: "high" });
    createTask(db, { title: "overdue", dueDate: "2026-10-01", priority: "low" });
    createTask(db, { title: "future", dueDate: "2026-12-01" });
    createTask(db, { title: "done overdue", dueDate: "2026-10-01", status: "done" });
    expect(focusTasks(db, "2026-10-11").map((t) => t.title)).toEqual(["overdue", "due today", "starred"]);
  });
});
