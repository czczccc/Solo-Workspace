import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProjectDot } from "@/components/tasks/task-meta";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/data/projects";
import { completedInWeek, getReview, listReviews } from "@/lib/data/reviews";
import { formatShortDate, isISODate, shiftWeek, weekEndISO, weekStartISO } from "@/lib/dates";
import { centsToInput, currency, formatCents } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "周报" };

export default async function ReviewPage({ searchParams }: PageProps<"/review">) {
  const { week } = await searchParams;
  const thisWeek = weekStartISO();
  const weekStart = typeof week === "string" && isISODate(week) ? weekStartISO(week) : thisWeek;
  const db = getDb();
  const review = getReview(db, weekStart);
  const projects = listProjects(db, { includeArchived: true });
  const metricProjects = projects.filter((p) => !p.archived || review?.metrics.some((m) => m.projectId === p.id));
  const completed = completedInWeek(db, weekStart);
  const history = listReviews(db).slice(0, 12);
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const groups = [...metricProjects, null].map((p) => ({
    project: p,
    tasks: completed.filter((t) => (p ? t.projectId === p.id : !t.projectId || !metricProjects.some((x) => x.id === t.projectId))),
  }));

  return (
    <PageTransition>
    <div className="grid gap-5">
      <PageHeader
        title="周报"
        description={`${formatShortDate(weekStart)} – ${formatShortDate(weekEndISO(weekStart))}${weekStart === thisWeek ? "（本周）" : ""}`}
        actions={
          <div className="flex gap-1">
            <Link href={`/review?week=${shiftWeek(weekStart, -1)}`} transitionTypes={["nav-back"]} className={buttonVariants({ variant: "secondary", size: "icon" })} aria-label="上一周">
              <ChevronLeft />
            </Link>
            {weekStart !== thisWeek && (
              <Link href="/review" className={buttonVariants({ variant: "secondary" })}>本周</Link>
            )}
            <Link href={`/review?week=${shiftWeek(weekStart, 1)}`} transitionTypes={["nav-forward"]} className={buttonVariants({ variant: "secondary", size: "icon" })} aria-label="下一周">
              <ChevronRight />
            </Link>
          </div>
        }
        className="mb-0"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid content-start gap-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <CardTitle>本周完成 · {completed.length}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {completed.length === 0 && <p className="text-body text-fg-muted">这一周还没有完成的任务。</p>}
              {groups
                .filter((g) => g.tasks.length > 0)
                .map((g) => (
                  <div key={g.project?.id ?? "none"}>
                    <h3 className="mb-1.5 flex items-center gap-2 text-caption font-medium text-fg-muted">
                      {g.project && <ProjectDot color={g.project.color} />}
                      {g.project?.name ?? "其他"} · {g.tasks.length}
                    </h3>
                    <ul className="grid gap-1">
                      {g.tasks.map((t) => (
                        <li key={t.id} className="flex items-start gap-2 text-body">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-fg" />
                          <span>{t.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </CardContent>
          </Card>

          {history.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
                <CardTitle>历史周报</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y text-body">
                  {history.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/review?week=${r.weekStart}`}
                        className={cn("flex items-center justify-between gap-2 py-2 hover:text-accent-fg", r.weekStart === weekStart && "font-medium text-accent-fg")}
                      >
                        <span>{formatShortDate(r.weekStart)} 周</span>
                        <span className="text-caption tabular-nums text-fg-muted">
                          收入 {formatCents(r.revenue)} · 利润{" "}
                          <span className={r.profit < 0 ? "text-danger-fg" : ""}>{formatCents(r.profit)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <ReviewForm
          key={weekStart}
          weekStart={weekStart}
          currency={currency()}
          initial={{
            highlights: review?.highlights ?? "",
            lessons: review?.lessons ?? "",
            nextFocus: review?.nextFocus ?? "",
            metrics: metricProjects.map((p) => {
              const m = review?.metrics.find((x) => x.projectId === p.id);
              return {
                projectId: p.id,
                name: projectById.get(p.id)!.name,
                color: p.color,
                outputs: m?.outputs ?? "",
                revenue: centsToInput(m?.revenueCents ?? 0),
                cost: centsToInput(m?.costCents ?? 0),
              };
            }),
          }}
        />
      </div>
    </div>
    </PageTransition>
  );
}
