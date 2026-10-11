"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import * as data from "@/lib/data/inbox";
import { INBOX_STATUSES } from "@/lib/db/schema";
import { dateOrNull, fail, id, optionalId, priority, type ActionResult } from "./validation";

function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addInboxAction(content: string): Promise<ActionResult> {
  await requireSession();
  try {
    data.addInboxItem(getDb(), z.string().trim().min(1, "内容不能为空").max(5000).parse(content));
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function convertInboxAction(
  itemId: number,
  input: { title?: string; projectId?: string | number | null; priority?: string; dueDate?: string; isFocus?: boolean },
): Promise<ActionResult> {
  await requireSession();
  try {
    const opts = z
      .object({
        title: z.string().trim().max(200).optional(),
        projectId: optionalId,
        priority: priority.default("medium"),
        dueDate: dateOrNull,
        isFocus: z.boolean().default(false),
      })
      .parse(input);
    const task = data.convertInboxItem(getDb(), id.parse(itemId), opts);
    if (!task) return { ok: false, error: "该条目已处理" };
    return done();
  } catch (e) {
    return fail(e);
  }
}

export async function setInboxStatusAction(itemId: number, status: string): Promise<ActionResult> {
  await requireSession();
  data.setInboxStatus(getDb(), id.parse(itemId), z.enum(INBOX_STATUSES).parse(status));
  return done();
}

export async function deleteInboxAction(itemId: number): Promise<ActionResult> {
  await requireSession();
  data.deleteInboxItem(getDb(), id.parse(itemId));
  return done();
}
