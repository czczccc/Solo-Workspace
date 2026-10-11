import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowRight, Flag } from "lucide-react";
import { FocusList } from "@/components/dashboard/focus-list";
import { QuickCapture } from "@/components/quick-capture";
import { ProjectDot } from "@/components/tasks/task-meta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/lib/db";
import { weekSummary } from "@/lib/data/dashboard";
import { listMilestones, listProjects } from "@/lib/data/projects";
import { focusTasks } from "@/lib/data/tasks";
import { formatShortDate, todayISO, weekEndISO } from "@/lib/dates";

function greeting(hour: number) {
  if (hour < 6) return "夜深了";
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export default async function DashboardPage() {
  const db = getDb();
  const now = new Date();
  const today = todayISO(now);
  const focus = focusTasks(db, today);
  const week = weekSummary(db, now);
  const projects = listProjects(db).map((p) => ({ id: p.id, name: p.name, color: p.color }));

  const stats = [
    { label: "本周完成", value: week.doneThisWeek, className: "text-success-fg" },
    { label: "进行中", value: week.doing, className: "text-accent-fg" },
    { label: "阻塞", value: week.blocked, className: week.blocked ? "text-danger-fg" : "" },
    { label: "待办", value: week.todo, className: "" },
  ];

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-body text-fg-muted">{format(now, "M月d日 EEEE", { locale: zhCN })}</p>
        <h1 className="text-heading font-semibold">{greeting(now.getHours())}，今天专注这 {focus.length} 件事</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
            <CardTitle>今日重点</CardTitle>
            <Link href="/kanban" className="text-caption text-fg-muted hover:text-fg">
              看板 <ArrowRight className="inline size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <FocusList tasks={focus} projects={projects} milestones={listMilestones(db)} today={today} />
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <CardTitle>快速记录</CardTitle>
              <Link href="/inbox" className="text-caption text-fg-muted hover:text-fg">
                收集箱 <ArrowRight className="inline size-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <QuickCapture />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <div>
                <CardTitle>本周进度</CardTitle>
                <p className="mt-1 text-caption text-fg-muted">
                  {formatShortDate(week.weekStart)} – {formatShortDate(weekEndISO(week.weekStart))}
                </p>
              </div>
              <Link href="/review" className="text-caption text-fg-muted hover:text-fg">
                周报 <ArrowRight className="inline size-3" />
              </Link>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-4 gap-2 text-center">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-lg bg-sunken py-2">
                    <div className={`text-title font-semibold tabular-nums ${s.className}`}>{s.value}</div>
                    <div className="text-caption text-fg-muted">{s.label}</div>
                  </div>
                ))}
              </div>
              <ul className="grid gap-3">
                {week.projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.slug}`} className="block rounded-lg p-1 -m-1 hover:bg-hover">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-body">
                        <span className="flex min-w-0 items-center gap-2 font-medium">
                          <ProjectDot color={p.color} />
                          <span className="truncate">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-caption text-fg-muted">
                          本周 +{p.doneThisWeek} · 未完成 {p.open}
                        </span>
                      </div>
                      <Progress value={p.total ? (p.done / p.total) * 100 : 0} color={p.color} />
                      {p.current && (
                        <p className="mt-1.5 flex items-center gap-1 truncate text-caption text-fg-muted">
                          <Flag className="size-3 shrink-0" /> {p.current.title}
                          {p.current.dueDate && ` · ${formatShortDate(p.current.dueDate)}`}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
