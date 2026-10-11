"use client";

import { MoreHorizontal, Star, Trash2 } from "lucide-react";
import { deleteTaskAction, moveTaskAction, toggleFocusAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction } from "@/components/use-action";
import { TASK_STATUSES } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { TaskMetaRow } from "./task-meta";
import type { TaskWithMeta } from "./types";

export function TaskCard({
  task,
  onOpen,
  draggable,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  task: TaskWithMeta;
  onOpen: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
}) {
  const { run } = useAction();
  return (
    <div
      data-testid="task-card"
      data-task-id={task.id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative rounded-lg border bg-surface p-3 shadow-xs transition hover:border-line-strong",
        draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
      )}
      style={task.project ? { borderLeft: `3px solid ${task.project.color}` } : undefined}
    >
      <button type="button" onClick={onOpen} className="block w-full pr-14 text-left">
        <span className={cn("text-body font-medium", task.status === "done" && "text-fg-muted line-through")}>
          {task.title}
        </span>
      </button>
      <div className="mt-2" onClick={onOpen}>
        <TaskMetaRow task={task} />
      </div>
      <div className="absolute right-1.5 top-1.5 flex items-center">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={task.isFocus ? "取消今日重点" : "设为今日重点"}
          aria-pressed={task.isFocus}
          onClick={() => run(() => toggleFocusAction(task.id, !task.isFocus))}
          className={cn(task.isFocus ? "text-warning-fg" : "text-fg-muted opacity-60 md:opacity-0 md:group-hover:opacity-100")}
        >
          <Star className={cn(task.isFocus && "fill-current")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="任务操作" className="text-fg-muted">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>移动到</DropdownMenuLabel>
            {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
              <DropdownMenuItem key={s} onSelect={() => run(() => moveTaskAction(task.id, s))}>
                {STATUS_LABEL[s]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              tone="danger"
              onSelect={() => {
                if (confirm("确定删除这个任务？")) run(() => deleteTaskAction(task.id), { success: "已删除" });
              }}
            >
              <Trash2 /> 删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
