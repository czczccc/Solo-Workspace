"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TASK_STATUSES } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/labels";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import type { MilestoneOption, ProjectOption, TaskWithMeta } from "./types";

/** Tasks grouped by status, used on the project detail page. */
export function GroupedTaskList({
  tasks,
  projects,
  milestones,
  projectId,
}: {
  tasks: TaskWithMeta[];
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  projectId: number;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const editing = editingId ? (tasks.find((t) => t.id === editingId) ?? null) : null;

  return (
    <div className="grid gap-4">
      <div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> 新任务
        </Button>
      </div>
      {TASK_STATUSES.map((s) => {
        const group = tasks.filter((t) => t.status === s);
        if (group.length === 0) return null;
        return (
          <section key={s}>
            <h3 className="mb-2 text-caption font-medium text-fg-muted">
              {STATUS_LABEL[s]} · {group.length}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.map((t) => (
                <TaskCard key={t.id} task={t} onOpen={() => setEditingId(t.id)} />
              ))}
            </div>
          </section>
        );
      })}
      {tasks.length === 0 && <p className="text-body text-fg-muted">这个项目还没有任务。</p>}
      <TaskDialog
        key={editing ? `e-${editing.id}` : "e"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditingId(null)}
        task={editing}
        projects={projects}
        milestones={milestones}
      />
      <TaskDialog
        key={`c-${creating}`}
        open={creating}
        onOpenChange={setCreating}
        projects={projects}
        milestones={milestones}
        defaults={{ projectId }}
      />
    </div>
  );
}
