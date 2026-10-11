import { CalendarDays, ListChecks } from "lucide-react";
import { daysUntil, formatShortDate } from "@/lib/dates";
import { PRIORITY_CLASS, PRIORITY_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { TaskWithMeta } from "./types";

export function ProjectDot({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", className)} style={{ background: color }} />;
}

export function PriorityBadge({ priority }: { priority: TaskWithMeta["priority"] }) {
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-caption font-medium", PRIORITY_CLASS[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function DueLabel({ dueDate, done }: { dueDate: string | null; done?: boolean }) {
  if (!dueDate) return null;
  const d = daysUntil(dueDate);
  const text = d === 0 ? "今天" : d === 1 ? "明天" : d === -1 ? "昨天" : formatShortDate(dueDate);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-caption text-fg-muted",
        !done && d < 0 && "font-medium text-danger-fg",
        !done && d === 0 && "font-medium text-warning-fg",
      )}
    >
      <CalendarDays className="size-3" />
      {!done && d < 0 ? `逾期 · ${text}` : text}
    </span>
  );
}

export function TaskMetaRow({ task, showProject = true }: { task: TaskWithMeta; showProject?: boolean }) {
  const total = task.subtasks.length;
  const doneCount = task.subtasks.filter((s) => s.done).length;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <PriorityBadge priority={task.priority} />
      {showProject && task.project && (
        <span className="inline-flex max-w-40 items-center gap-1 truncate text-caption text-fg-muted">
          <ProjectDot color={task.project.color} />
          <span className="truncate">{task.project.name}</span>
        </span>
      )}
      <DueLabel dueDate={task.dueDate} done={task.status === "done"} />
      {total > 0 && (
        <span className={cn("inline-flex items-center gap-1 text-caption text-fg-muted", doneCount === total && "text-success-fg")}>
          <ListChecks className="size-3" />
          {doneCount}/{total}
        </span>
      )}
    </div>
  );
}
