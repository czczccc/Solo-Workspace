import { describe, expect, it } from "vitest";
import { listProjects } from "@/lib/data/projects";
import { seedDefaults } from "@/lib/db/seed";
import { memoryDb } from "./helpers";

describe("database bootstrap", () => {
  it("migrates and seeds the three default projects once", () => {
    const db = memoryDb();
    seedDefaults(db);
    const list = listProjects(db);
    expect(list.map((p) => p.slug)).toEqual(["ai-drama", "ai-science", "free-llm-api"]);
  });

  it("enforces foreign keys", () => {
    const db = memoryDb();
    expect(() => db.$client.prepare("insert into subtasks (task_id, title) values (999, 'x')").run()).toThrow();
  });
});
