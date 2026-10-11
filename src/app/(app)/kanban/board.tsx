"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { LayoutGroup, motion } from "framer-motion";
import { toast } from "sonner";
import { moveTaskAction } from "@/app/actions/tasks";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { MilestoneOption, ProjectOption, TaskWithMeta } from "@/components/tasks/types";
import { Button } from "@/components/ui/button";
import { TASK_STATUSES, type TaskStatus } from "@/lib/db/schema";
import { STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { transition } from "@/design-system/motion";

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: "bg-sunken-foreground",
  doing: "bg-accent",
  blocked: "bg-danger",
  done: "bg-success",
};

type Move = { id: number; status: TaskStatus; index: number };

function applyMove(tasks: TaskWithMeta[], move: Move) {
  const moving = tasks.find((t) => t.id === move.id);
  if (!moving) return tasks;
  const rest = tasks.filter((t) => t.id !== move.id);
  const column = rest.filter((t) => t.status === move.status);
  const before = column[move.index];
  const updated = { ...moving, status: move.status };
  const at = before ? rest.indexOf(before) : rest.length;
  return [...rest.slice(0, at), updated, ...rest.slice(at)];
}

export function Board({
  tasks,
  projects,
  milestones,
  defaultProjectId,
}: {
  tasks: TaskWithMeta[];
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  defaultProjectId?: number;
}) {
  const [optimistic, addMove] = useOptimistic(tasks, applyMove);
  const [, startTransition] = useTransition();
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>("todo");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState<TaskStatus | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<{ status: TaskStatus; index: number } | null>(null);

  const editing = editingId ? (tasks.find((t) => t.id === editingId) ?? null) : null;

  function move(m: Move) {
    startTransition(async () => {
      addMove(m);
      const r = await moveTaskAction(m.id, m.status, m.index);
      if (!r.ok) toast.error(r.error);
    });
  }

  function onColumnDragOver(e: React.DragEvent, status: TaskStatus) {
    if (draggingId === null) return;
    e.preventDefault();
    const cards = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-task-id]")).filter(
      (el) => Number(el.dataset.taskId) !== draggingId,
    );
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        index = i;
        break;
      }
    }
    if (dropTarget?.status !== status || dropTarget.index !== index) setDropTarget({ status, index });
  }

  function onDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    if (draggingId !== null && dropTarget) move({ id: draggingId, status, index: dropTarget.index });
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <>
      {/* Phone: one column at a time */}
      <div className="no-scrollbar -mx-4 mb-3 flex gap-1 overflow-x-auto px-4 md:hidden" role="tablist">
        {TASK_STATUSES.map((s) => {
          const n = optimistic.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              role="tab"
              aria-selected={mobileColumn === s}
              onClick={() => setMobileColumn(s)}
              className={cn(
                "pressable relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-body",
                mobileColumn === s ? "border-accent bg-accent text-on-accent shadow-xs" : "glass-subtle border-transparent text-fg-muted",
              )}
            >
              {STATUS_LABEL[s]} <span className="text-caption opacity-80">{n}</span>
            </button>
          );
        })}
      </div>

      <LayoutGroup>
      <div className="grid gap-4 md:grid-cols-4">
        {TASK_STATUSES.map((status) => {
          const column = optimistic.filter((t) => t.status === status);
          return (
            <section
              key={status}
              data-testid={`column-${status}`}
              aria-label={STATUS_LABEL[status]}
              className={cn(
                "glass-subtle relative flex min-h-40 flex-col rounded-card p-2 transition-shadow duration-base md:min-h-96",
                mobileColumn !== status && "hidden md:flex",
                dropTarget?.status === status && "shadow-ring",
              )}
              onDragOver={(e) => onColumnDragOver(e, status)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
              }}
              onDrop={(e) => onDrop(e, status)}
            >
              <header className="mb-2 hidden items-center justify-between px-1.5 pt-1 md:flex">
                <h2 className="flex items-center gap-2 text-body font-semibold">
                  <span className={cn("size-2 rounded-full", COLUMN_ACCENT[status])} />
                  {STATUS_LABEL[status]}
                  <span className="font-normal text-fg-muted">{column.length}</span>
                </h2>
                <Button variant="ghost" size="icon-sm" onClick={() => setCreating(status)} aria-label={`在${STATUS_LABEL[status]}新建任务`}>
                  <Plus />
                </Button>
              </header>
              <div className="flex flex-1 flex-col gap-2">
                {column.map((t, i) => (
                  <motion.div
                    key={t.id}
                    layout="position"
                    layoutId={`task-${t.id}`}
                    transition={transition.layout}
                  >
                    {dropTarget?.status === status && dropTarget.index === i && draggingId !== t.id && (
                      <div className="mb-2 h-1 rounded-full bg-accent" />
                    )}
                    <TaskCard
                      task={t}
                      onOpen={() => setEditingId(t.id)}
                      draggable
                      dragging={draggingId === t.id}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", String(t.id));
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTarget(null);
                      }}
                    />
                  </motion.div>
                ))}
                {dropTarget?.status === status && dropTarget.index >= column.filter((t) => t.id !== draggingId).length && (
                  <div className="h-1 rounded-full bg-accent" />
                )}
                {column.length === 0 && (
                  <p className="px-2 py-6 text-center text-caption text-fg-muted">暂无任务</p>
                )}
                <button
                  type="button"
                  onClick={() => setCreating(status)}
                  className="mt-auto flex items-center gap-1.5 rounded-lg px-2 py-2 text-body text-fg-muted hover:bg-hover md:hidden"
                >
                  <Plus className="size-4" /> 添加到「{STATUS_LABEL[status]}」
                </button>
              </div>
            </section>
          );
        })}
      </div>
      </LayoutGroup>

      <TaskDialog
        key={editing ? `edit-${editing.id}` : "edit-none"}
        open={!!editing}
        onOpenChange={(o) => !o && setEditingId(null)}
        task={editing}
        projects={projects}
        milestones={milestones}
      />
      <TaskDialog
        key={`create-${creating}`}
        open={creating !== null}
        onOpenChange={(o) => !o && setCreating(null)}
        projects={projects}
        milestones={milestones}
        defaults={{ status: creating ?? "todo", projectId: defaultProjectId ?? null }}
      />
    </>
  );
}
