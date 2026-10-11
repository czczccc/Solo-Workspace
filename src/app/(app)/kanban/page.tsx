import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { getDb } from "@/lib/db";
import { listMilestones, listProjects } from "@/lib/data/projects";
import { listTasks } from "@/lib/data/tasks";
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/db/schema";
import { Board } from "./board";
import { KanbanFilters } from "./filters";

export const metadata: Metadata = { title: "看板" };

export default async function KanbanPage({ searchParams }: PageProps<"/kanban">) {
  const sp = await searchParams;
  const db = getDb();
  const projects = listProjects(db);
  const project = projects.find((p) => p.slug === sp.project);
  const priority = TASK_PRIORITIES.includes(sp.priority as TaskPriority) ? (sp.priority as TaskPriority) : undefined;
  const tasks = listTasks(db, { projectId: project?.id, priority }).filter(
    // Hide tasks of archived projects unless filtering on one explicitly.
    (t) => !t.projectId || project || projects.some((p) => p.id === t.projectId),
  );

  return (
    <>
      <PageHeader
        title="看板"
        description={project ? project.name : "所有项目"}
        actions={
          <Suspense>
            <KanbanFilters projects={projects.map((p) => ({ slug: p.slug, name: p.name }))} />
          </Suspense>
        }
        className="[&>div:last-child]:w-full sm:[&>div:last-child]:w-auto"
      />
      <Board
        key={`${sp.project ?? ""}-${sp.priority ?? ""}`}
        tasks={tasks}
        projects={projects.map((p) => ({ id: p.id, name: p.name, color: p.color }))}
        milestones={listMilestones(db)}
        defaultProjectId={project?.id}
      />
    </>
  );
}
