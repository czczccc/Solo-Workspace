"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import * as data from "@/lib/data/projects";
import { color, dateOrNull, fail, id, longText, milestoneStatus, title, type ActionResult } from "./validation";

const projectSchema = z.object({
  name: z.string().trim().min(1, "名称不能为空").max(80),
  description: longText,
  goal: longText,
  color: color.default("#6366f1"),
});

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createProjectAction(input: z.input<typeof projectSchema>): Promise<ActionResult & { slug?: string }> {
  await requireSession();
  try {
    const p = data.createProject(getDb(), projectSchema.parse(input));
    revalidatePath("/", "layout");
    return { ok: true, slug: p.slug };
  } catch (e) {
    return fail(e);
  }
}

export async function updateProjectAction(projectId: number, input: z.input<typeof projectSchema>): Promise<ActionResult> {
  await requireSession();
  try {
    data.updateProject(getDb(), id.parse(projectId), projectSchema.parse(input));
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function archiveProjectAction(projectId: number, archived: boolean): Promise<ActionResult> {
  await requireSession();
  data.updateProject(getDb(), id.parse(projectId), { archived: Boolean(archived) });
  return done();
}

export async function createMilestoneAction(projectId: number, input: { title: string; dueDate?: string }): Promise<ActionResult> {
  await requireSession();
  try {
    data.createMilestone(getDb(), id.parse(projectId), title.parse(input.title), dateOrNull.parse(input.dueDate));
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function updateMilestoneAction(
  milestoneId: number,
  input: { title?: string; dueDate?: string | null; status?: string },
): Promise<ActionResult> {
  await requireSession();
  try {
    const patch = z
      .object({ title: title.optional(), dueDate: dateOrNull.optional(), status: milestoneStatus.optional() })
      .parse(input);
    const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => k in input));
    data.updateMilestone(getDb(), id.parse(milestoneId), clean);
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteMilestoneAction(milestoneId: number): Promise<ActionResult> {
  await requireSession();
  data.deleteMilestone(getDb(), id.parse(milestoneId));
  return done();
}
