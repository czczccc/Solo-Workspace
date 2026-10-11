import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, SquareKanban, Target } from "lucide-react";
import { EditProjectButtons } from "@/components/projects/project-form";
import { Milestones } from "@/components/projects/milestones";
import { GroupedTaskList } from "@/components/tasks/task-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDb } from "@/lib/db";
import { getProjectBySlug, listMilestones, listProjects } from "@/lib/data/projects";
import { listTasks } from "@/lib/data/tasks";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getProjectBySlug(getDb(), slug)?.name ?? "项目" };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const db = getDb();
  const project = getProjectBySlug(db, slug);
  if (!project) notFound();

  const tasks = listTasks(db, { projectId: project.id });
  const milestones = listMilestones(db, project.id);
  const allMilestones = listMilestones(db);
  const progress: Record<number, { total: number; done: number }> = {};
  for (const t of tasks) {
    if (!t.milestoneId) continue;
    progress[t.milestoneId] ??= { total: 0, done: 0 };
    progress[t.milestoneId].total += 1;
    if (t.status === "done") progress[t.milestoneId].done += 1;
  }
  const done = tasks.filter((t) => t.status === "done").length;
  const projectOptions = listProjects(db).map((p) => ({ id: p.id, name: p.name, color: p.color }));
  if (project.archived) projectOptions.push({ id: project.id, name: project.name, color: project.color });

  return (
    <PageTransition>
    <div className="grid gap-5">
      <div>
        <Link href="/projects" transitionTypes={["nav-back"]} className="mb-2 inline-flex items-center text-body text-fg-muted hover:text-fg">
          <ChevronLeft className="size-4" /> 项目
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-title font-semibold md:text-heading">
              <span className="size-3 rounded-full" style={{ background: project.color }} />
              {project.name}
              {project.archived && <Badge tone="neutral">已归档</Badge>}
            </h1>
            {project.description && <p className="mt-1 text-body text-fg-muted">{project.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/kanban?project=${project.slug}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <SquareKanban /> 看板
            </Link>
            <EditProjectButtons
              project={{
                id: project.id,
                name: project.name,
                description: project.description,
                goal: project.goal,
                color: project.color,
                archived: project.archived,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="grid content-start gap-5">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="size-4" /> 目标
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <p className="whitespace-pre-wrap text-body">{project.goal || <span className="text-fg-muted">未设置目标</span>}</p>
              <div>
                <div className="mb-1 flex justify-between text-caption text-fg-muted">
                  <span>任务完成</span>
                  <span className="tabular-nums">{done}/{tasks.length}</span>
                </div>
                <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} color={project.color} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
              <CardTitle>里程碑</CardTitle>
            </CardHeader>
            <CardContent>
              <Milestones projectId={project.id} milestones={milestones} progress={progress} color={project.color} />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
            <CardTitle>任务</CardTitle>
          </CardHeader>
          <CardContent>
            <GroupedTaskList tasks={tasks} projects={projectOptions} milestones={allMilestones} projectId={project.id} />
          </CardContent>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}
