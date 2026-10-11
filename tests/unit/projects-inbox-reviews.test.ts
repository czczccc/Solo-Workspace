import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { weekSummary } from "@/lib/data/dashboard";
import { backupDatabase, exportAll, pruneBackups } from "@/lib/data/export";
import { addInboxItem, convertInboxItem, listInbox } from "@/lib/data/inbox";
import { createMilestone, createProject, projectOverviews, updateMilestone } from "@/lib/data/projects";
import { completedInWeek, getReview, listReviews, totals, upsertReview } from "@/lib/data/reviews";
import { createTask, getTask, updateTask } from "@/lib/data/tasks";
import { tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { weekStartISO } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import { memoryDb } from "./helpers";

describe("projects", () => {
  it("creates unique slugs and reports progress and current milestone", () => {
    const db = memoryDb();
    expect(createProject(db, { name: "AI Drama Overseas" }).slug).toBe("ai-drama-overseas");
    expect(createProject(db, { name: "短剧" }).slug).toBe("project");
    expect(createProject(db, { name: "新项目" }).slug).toBe("project-2");
    const m1 = createMilestone(db, 1, "MVP", null);
    createMilestone(db, 1, "Launch", "2026-12-01");
    updateMilestone(db, m1.id, { status: "done" });
    createTask(db, { title: "a", projectId: 1, status: "done" });
    createTask(db, { title: "b", projectId: 1, status: "blocked" });
    const p = projectOverviews(db).find((x) => x.id === 1)!;
    expect([p.total, p.done, p.blocked]).toEqual([2, 1, 1]);
    expect(p.current?.title).toBe("Launch");
  });
});

describe("inbox", () => {
  it("converts an idea into a task exactly once", () => {
    const db = memoryDb();
    const item = addInboxItem(db, "写第 3 集剧本\n参考热门题材");
    const task = convertInboxItem(db, item.id, { projectId: 1, priority: "high" })!;
    expect(task.title).toBe("写第 3 集剧本");
    expect(getTask(db, task.id)?.description).toBe("参考热门题材");
    expect(listInbox(db, "open")).toHaveLength(0);
    expect(listInbox(db, "converted")[0].taskId).toBe(task.id);
    expect(convertInboxItem(db, item.id)).toBeNull();
  });
});

describe("weekly review", () => {
  it("upserts metrics and totals profit", () => {
    const db = memoryDb();
    const input = {
      highlights: "上线",
      lessons: "",
      nextFocus: "",
      metrics: [
        { projectId: 1, outputs: "3 集", revenueCents: parseMoneyToCents("1,200.5"), costCents: 30000 },
        { projectId: 3, outputs: "", revenueCents: 0, costCents: 5000 },
      ],
    };
    upsertReview(db, "2026-10-05", input);
    upsertReview(db, "2026-10-05", { ...input, highlights: "更新", metrics: [{ ...input.metrics[0], costCents: 10000 }] });
    const r = getReview(db, "2026-10-05")!;
    expect(r.highlights).toBe("更新");
    expect(r.metrics).toHaveLength(2);
    expect(totals(r.metrics)).toEqual({ revenue: 120050, cost: 15000, profit: 105050 });
    expect(listReviews(db)[0].profit).toBe(105050);
  });

  it("counts tasks completed inside the week only", () => {
    const db = memoryDb();
    const inWeek = createTask(db, { title: "in", projectId: 2 });
    const before = createTask(db, { title: "before" });
    updateTask(db, inWeek.id, { status: "done" });
    updateTask(db, before.id, { status: "done" });
    db.update(tasks).set({ completedAt: new Date("2026-10-07T10:00:00+08:00") }).where(eq(tasks.id, inWeek.id)).run();
    db.update(tasks).set({ completedAt: new Date("2026-10-04T23:30:00+08:00") }).where(eq(tasks.id, before.id)).run();
    expect(completedInWeek(db, "2026-10-05").map((t) => t.title)).toEqual(["in"]);
    const summary = weekSummary(db, new Date("2026-10-08T12:00:00+08:00"));
    expect(summary.weekStart).toBe("2026-10-05");
    expect(summary.doneThisWeek).toBe(1);
    expect(summary.projects.find((p) => p.id === 2)?.doneThisWeek).toBe(1);
  });
});

describe("dates and money", () => {
  it("uses Monday as week start", () => {
    expect(weekStartISO("2026-10-11")).toBe("2026-10-05");
    expect(weekStartISO("2026-10-12")).toBe("2026-10-12");
  });
  it("parses money", () => {
    expect(parseMoneyToCents("12")).toBe(1200);
    expect(parseMoneyToCents("¥0.5")).toBe(50);
    expect(parseMoneyToCents("abc")).toBe(0);
    expect(parseMoneyToCents("-3.25")).toBe(-325);
  });
});

describe("export and backup", () => {
  it("exports every table and writes a restorable backup", async () => {
    const db = memoryDb();
    createTask(db, { title: "keep me" });
    const dump = exportAll(db);
    expect(Object.keys(dump.data)).toEqual([
      "projects", "milestones", "tasks", "subtasks", "inboxItems", "weeklyReviews", "weeklyProjectMetrics",
    ]);
    expect(dump.data.tasks[0].title).toBe("keep me");

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "solo-bk-"));
    const file = await backupDatabase(db, dir);
    const { default: Database } = await import("better-sqlite3");
    const copy = new Database(file, { readonly: true });
    expect(copy.prepare("select title from tasks").get()).toEqual({ title: "keep me" });
    copy.close();
    for (let i = 0; i < 3; i++) fs.writeFileSync(path.join(dir, `solo-workspace-2020010${i}-000000.sqlite`), "");
    expect(pruneBackups(dir, 2)).toHaveLength(2);
    expect(fs.readdirSync(dir)).toHaveLength(2);
  });
});
