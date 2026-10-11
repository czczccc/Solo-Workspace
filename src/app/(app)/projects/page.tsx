import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewProjectButton } from "@/components/projects/project-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/lib/db";
import { projectOverviews } from "@/lib/data/projects";
import { formatShortDate } from "@/lib/dates";

export const metadata: Metadata = { title: "项目" };

export default async function ProjectsPage() {
  const all = projectOverviews(getDb(), { includeArchived: true });
  const active = all.filter((p) => !p.archived);
  const archived = all.filter((p) => p.archived);

  return (
    <>
      <PageHeader title="项目" description={`${active.length} 个进行中的项目`} actions={<NewProjectButton />} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((p) => {
          const msDone = p.milestones.filter((m) => m.status === "done").length;
          return (
            <Link key={p.id} href={`/projects/${p.slug}`} className="group">
              <Card className="h-full transition group-hover:border-line-strong" style={{ borderTop: `3px solid ${p.color}` }}>
                <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
                  <div className="min-w-0">
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription className="mt-1.5">{p.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 text-body">
                  {p.goal && (
                    <p className="flex gap-2 text-fg-muted">
                      <Target className="mt-0.5 size-4 shrink-0" />
                      <span className="line-clamp-2">{p.goal}</span>
                    </p>
                  )}
                  <div>
                    <div className="mb-1 flex justify-between text-caption text-fg-muted">
                      <span>任务 {p.done}/{p.total}</span>
                      <span>{p.blocked > 0 && <span className="text-danger-fg">阻塞 {p.blocked} · </span>}里程碑 {msDone}/{p.milestones.length}</span>
                    </div>
                    <Progress value={p.total ? (p.done / p.total) * 100 : 0} color={p.color} />
                  </div>
                  <p className="flex items-center gap-2 text-caption text-fg-muted">
                    <Flag className="size-3.5" />
                    {p.current ? `${p.current.title}${p.current.dueDate ? ` · ${formatShortDate(p.current.dueDate)}` : ""}` : "暂无进行中的里程碑"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {archived.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-2 text-body font-medium text-fg-muted">已归档</h2>
          <ul className="flex flex-wrap gap-2">
            {archived.map((p) => (
              <li key={p.id}>
                <Link href={`/projects/${p.slug}`} className="rounded-control border px-3 py-1.5 text-body text-fg-muted hover:bg-hover">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
