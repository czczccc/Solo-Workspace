import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES, MILESTONE_STATUSES } from "@/lib/db/schema";
import { isISODate } from "@/lib/dates";

export const id = z.coerce.number().int().positive();
export const optionalId = z
  .union([z.literal(""), z.literal("none"), z.null(), z.undefined(), z.coerce.number().int().positive()])
  .transform((v) => (typeof v === "number" ? v : null));
export const dateOrNull = z
  .union([z.literal(""), z.null(), z.undefined(), z.string().refine(isISODate, "日期格式错误")])
  .transform((v) => (v ? v : null));
export const status = z.enum(TASK_STATUSES);
export const priority = z.enum(TASK_PRIORITIES);
export const milestoneStatus = z.enum(MILESTONE_STATUSES);
export const title = z.string().trim().min(1, "标题不能为空").max(200);
export const longText = z.string().max(20000).default("");
export const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export type ActionResult = { ok: true } | { ok: false; error: string };

export function fail(err: unknown): ActionResult {
  if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "输入有误" };
  throw err;
}
