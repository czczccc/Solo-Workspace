"use client";

import { useState } from "react";
import { Check, Circle, CircleDot, Plus, Trash2 } from "lucide-react";
import { createMilestoneAction, deleteMilestoneAction, updateMilestoneAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAction } from "@/components/use-action";
import type { Milestone, MilestoneStatus } from "@/lib/db/schema";
import { formatShortDate } from "@/lib/dates";
import { MILESTONE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const NEXT: Record<MilestoneStatus, MilestoneStatus> = { planned: "active", active: "done", done: "planned" };

export function Milestones({
  projectId,
  milestones,
  progress,
  color,
}: {
  projectId: number;
  milestones: Milestone[];
  progress: Record<number, { total: number; done: number }>;
  color: string;
}) {
  const { pending, run } = useAction();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  return (
    <div className="grid gap-3">
      {milestones.length === 0 && <p className="text-body text-fg-muted">还没有里程碑，添加第一个吧。</p>}
      <ol className="grid gap-2">
        {milestones.map((m) => {
          const p = progress[m.id] ?? { total: 0, done: 0 };
          const Icon = m.status === "done" ? Check : m.status === "active" ? CircleDot : Circle;
          return (
            <li key={m.id} className="flex items-start gap-3 rounded-lg border p-3">
              <button
                type="button"
                title={`${MILESTONE_LABEL[m.status]}，点击切换为${MILESTONE_LABEL[NEXT[m.status]]}`}
                aria-label={`里程碑状态：${MILESTONE_LABEL[m.status]}`}
                onClick={() => run(() => updateMilestoneAction(m.id, { status: NEXT[m.status] }))}
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  m.status === "done" && "border-success bg-success text-on-accent",
                  m.status === "active" && "border-accent text-accent-fg",
                )}
              >
                <Icon className="size-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className={cn("text-body font-medium", m.status === "done" && "text-fg-muted line-through")}>{m.title}</span>
                  <span className="text-caption text-fg-muted">
                    {MILESTONE_LABEL[m.status]}
                    {m.dueDate && ` · ${formatShortDate(m.dueDate)}`}
                  </span>
                </div>
                {p.total > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={(p.done / p.total) * 100} color={color} className="h-1.5" />
                    <span className="shrink-0 text-caption tabular-nums text-fg-muted">{p.done}/{p.total}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="删除里程碑"
                className="text-fg-muted"
                onClick={() => confirm(`删除里程碑「${m.title}」？关联任务会保留。`) && run(() => deleteMilestoneAction(m.id))}
              >
                <Trash2 />
              </Button>
            </li>
          );
        })}
      </ol>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createMilestoneAction(projectId, { title, dueDate: due }), {
            onOk: () => {
              setTitle("");
              setDue("");
            },
          });
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="新里程碑" aria-label="里程碑标题" className="min-w-40 flex-1" />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="里程碑日期" className="w-40" />
        <Button type="submit" variant="secondary" disabled={pending || !title.trim()}>
          <Plus /> 添加
        </Button>
      </form>
    </div>
  );
}
