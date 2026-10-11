import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import type { DB } from "@/lib/db";
import { tasks, weeklyProjectMetrics, weeklyReviews } from "@/lib/db/schema";
import { weekRange } from "@/lib/dates";

export type MetricInput = {
  projectId: number;
  outputs: string;
  revenueCents: number;
  costCents: number;
};

export type ReviewInput = {
  highlights: string;
  lessons: string;
  nextFocus: string;
  metrics: MetricInput[];
};

export function getReview(db: DB, weekStart: string) {
  const review = db.select().from(weeklyReviews).where(eq(weeklyReviews.weekStart, weekStart)).get();
  if (!review) return null;
  const metrics = db
    .select()
    .from(weeklyProjectMetrics)
    .where(eq(weeklyProjectMetrics.reviewId, review.id))
    .all();
  return { ...review, metrics };
}

export function upsertReview(db: DB, weekStart: string, input: ReviewInput) {
  return db.transaction((tx) => {
    const now = new Date();
    const review = tx
      .insert(weeklyReviews)
      .values({ weekStart, highlights: input.highlights, lessons: input.lessons, nextFocus: input.nextFocus })
      .onConflictDoUpdate({
        target: weeklyReviews.weekStart,
        set: { highlights: input.highlights, lessons: input.lessons, nextFocus: input.nextFocus, updatedAt: now },
      })
      .returning()
      .get();
    for (const m of input.metrics) {
      tx.insert(weeklyProjectMetrics)
        .values({ reviewId: review.id, ...m })
        .onConflictDoUpdate({
          target: [weeklyProjectMetrics.reviewId, weeklyProjectMetrics.projectId],
          set: { outputs: m.outputs, revenueCents: m.revenueCents, costCents: m.costCents },
        })
        .run();
    }
    return review;
  });
}

export function totals(metrics: { revenueCents: number; costCents: number }[]) {
  const revenue = metrics.reduce((s, m) => s + m.revenueCents, 0);
  const cost = metrics.reduce((s, m) => s + m.costCents, 0);
  return { revenue, cost, profit: revenue - cost };
}

export function completedInWeek(db: DB, weekStart: string) {
  const { start, end } = weekRange(weekStart);
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.status, "done"), gte(tasks.completedAt, start), lt(tasks.completedAt, end)))
    .orderBy(asc(tasks.completedAt))
    .all();
}

export function listReviews(db: DB) {
  const reviews = db.select().from(weeklyReviews).orderBy(desc(weeklyReviews.weekStart)).all();
  const metrics = db.select().from(weeklyProjectMetrics).all();
  return reviews.map((r) => ({ ...r, ...totals(metrics.filter((m) => m.reviewId === r.id)) }));
}
