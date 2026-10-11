"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { upsertReview } from "@/lib/data/reviews";
import { isISODate, weekStartISO } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import { fail, id, type ActionResult } from "./validation";

const schema = z.object({
  weekStart: z.string().refine(isISODate, "日期格式错误"),
  highlights: z.string().max(20000).default(""),
  lessons: z.string().max(20000).default(""),
  nextFocus: z.string().max(20000).default(""),
  metrics: z
    .array(
      z.object({
        projectId: id,
        outputs: z.string().max(20000).default(""),
        revenue: z.string().max(30).default(""),
        cost: z.string().max(30).default(""),
      }),
    )
    .max(50),
});

export async function saveReviewAction(input: z.input<typeof schema>): Promise<ActionResult> {
  await requireSession();
  try {
    const r = schema.parse(input);
    upsertReview(getDb(), weekStartISO(r.weekStart), {
      highlights: r.highlights,
      lessons: r.lessons,
      nextFocus: r.nextFocus,
      metrics: r.metrics.map((m) => ({
        projectId: m.projectId,
        outputs: m.outputs,
        revenueCents: parseMoneyToCents(m.revenue),
        costCents: parseMoneyToCents(m.cost),
      })),
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
