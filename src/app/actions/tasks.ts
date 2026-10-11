"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import * as data from "@/lib/data/tasks";
import { dateOrNull, fail, id, longText, optionalId, priority, status, title, type ActionResult } from "./validation";

const taskSchema = z.object({
  title,
  description: longText,
  projectId: optionalId,
  milestoneId: optionalId,
  status: status.default("todo"),
  priority: priority.default("medium"),
  dueDate: dateOrNull,
  isFocus: z.boolean().default(false),
});

export type TaskFormInput = z.input<typeof taskSchema>;

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createTaskAction(input: TaskFormInput & { subtasks?: string[] }): Promise<ActionResult & { id?: number }> {
  await requireSession();
  try {
    const parsed = taskSchema.parse(input);
    const subtasks = z.array(title).max(50).default([]).parse(input.subtasks ?? []);
    const db = getDb();
    const task = data.createTask(db, parsed);
    for (const s of subtasks) data.addSubtask(db, task.id, s);
    revalidatePath("/", "layout");
    return { ok: true, id: task.id };
  } catch (e) {
    return fail(e);
  }
}

export async function updateTaskAction(taskId: number, input: Partial<TaskFormInput>): Promise<ActionResult> {
  await requireSession();
  try {
    const parsed = taskSchema.partial().parse(input);
    // partial() keeps defaults; only apply keys the caller actually sent.
    const patch = Object.fromEntries(Object.entries(parsed).filter(([k]) => k in input));
    data.updateTask(getDb(), id.parse(taskId), patch);
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function moveTaskAction(taskId: number, to: string, index?: number): Promise<ActionResult> {
  await requireSession();
  try {
    data.moveTask(getDb(), id.parse(taskId), status.parse(to), index === undefined ? undefined : z.number().int().min(0).parse(index));
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function toggleFocusAction(taskId: number, isFocus: boolean): Promise<ActionResult> {
  await requireSession();
  data.updateTask(getDb(), id.parse(taskId), { isFocus: Boolean(isFocus) });
  return done();
}

export async function completeTaskAction(taskId: number, completed: boolean): Promise<ActionResult> {
  await requireSession();
  data.updateTask(getDb(), id.parse(taskId), { status: completed ? "done" : "todo" });
  return done();
}

export async function deleteTaskAction(taskId: number): Promise<ActionResult> {
  await requireSession();
  data.deleteTask(getDb(), id.parse(taskId));
  return done();
}

export async function addSubtaskAction(taskId: number, text: string): Promise<ActionResult> {
  await requireSession();
  try {
    data.addSubtask(getDb(), id.parse(taskId), title.parse(text));
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function toggleSubtaskAction(subtaskId: number, isDone: boolean): Promise<ActionResult> {
  await requireSession();
  data.setSubtaskDone(getDb(), id.parse(subtaskId), Boolean(isDone));
  return done();
}

export async function deleteSubtaskAction(subtaskId: number): Promise<ActionResult> {
  await requireSession();
  data.deleteSubtask(getDb(), id.parse(subtaskId));
  return done();
}
