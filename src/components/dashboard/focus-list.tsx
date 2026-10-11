"use client";

import { useState } from "react";
import { Plus, Star, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { transition } from "@/design-system/motion";
import { completeTaskAction, toggleFocusAction } from "@/app/actions/tasks";
import { TaskMetaRow } from "@/components/tasks/task-meta";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { MilestoneOption, ProjectOption, TaskWithMeta } from "@/components/tasks/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAction } from "@/components/use-action";
import { cn } from "@/lib/utils";

export function FocusList({
  tasks,
  projects,
  milestones,
  today,
}: {
  tasks: TaskWithMeta[];
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  today: string;
}) {
  const { run } = useAction();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const editing = editingId ? (tasks.find((t) => t.id === editingId) ?? null) : null;

  return (
    <>
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line px-4 py-8 text-center">
          <Sun className="size-6 text-warning-fg" />
          <p className="text-body font-medium">今天还没有重点任务</p>
          <p className="text-caption text-fg-muted">在看板上给任务标星，或设置今天到期，它就会出现在这里。</p>
        </div>
      ) : (
        <ul className="divide-y" data-testid="focus-list">
          <AnimatePresence initial={false}>
          {tasks.map((t) => (
            <motion.li
              key={t.id}
              layout="position"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, x: 24 }}
              transition={transition.smooth}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-3 py-2.5">
              <Checkbox
                className="mt-0.5"
                checked={false}
                onCheckedChange={() => run(() => completeTaskAction(t.id, true), { success: `已完成：${t.title}` })}
                aria-label={`完成 ${t.title}`}
              />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setEditingId(t.id)}>
                <span className="block text-body font-medium">{t.title}</span>
                <span className="mt-1 block">
                  <TaskMetaRow task={t} />
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => run(() => toggleFocusAction(t.id, !t.isFocus))}
                aria-label={t.isFocus ? "取消今日重点" : "设为今日重点"}
                aria-pressed={t.isFocus}
                className={cn(t.isFocus ? "text-warning-fg" : "text-fg-muted")}
              >
                <Star className={cn(t.isFocus && "fill-current")} />
              </Button>
              </div>
            </motion.li>
          ))}
          </AnimatePresence>
        </ul>
      )}
      <Button variant="ghost" size="sm" className="mt-2 text-fg-muted" onClick={() => setCreating(true)}>
        <Plus /> 添加今日任务
      </Button>
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
        defaults={{ isFocus: true, dueDate: today }}
      />
    </>
  );
}
