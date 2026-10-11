"use client";

import { useState } from "react";
import { Plus, Star, Trash2, X } from "lucide-react";
import {
  addSubtaskAction,
  createTaskAction,
  deleteSubtaskAction,
  deleteTaskAction,
  toggleSubtaskAction,
  updateTaskAction,
} from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/use-action";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/db/schema";
import { PRIORITY_LABEL, STATUS_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { MilestoneOption, ProjectOption, TaskWithMeta } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskWithMeta | null;
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  defaults?: { status?: TaskStatus; projectId?: number | null; isFocus?: boolean; dueDate?: string };
};

export function TaskDialog(props: Props) {
  const { open, onOpenChange, task } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-full max-w-lg overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>{task ? "编辑任务" : "新建任务"}</DialogTitle>
          <DialogDescription className="sr-only">任务详情</DialogDescription>
        </DialogHeader>
        <TaskForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, projects, milestones, defaults, onOpenChange }: Props) {
  const { pending, run } = useAction();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState<string>(String(task?.projectId ?? defaults?.projectId ?? ""));
  const [milestoneId, setMilestoneId] = useState<string>(String(task?.milestoneId ?? ""));
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaults?.status ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaults?.dueDate ?? "");
  const [isFocus, setIsFocus] = useState(task?.isFocus ?? defaults?.isFocus ?? false);
  const [draftSubtasks, setDraftSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const projectMilestones = milestones.filter((m) => String(m.projectId) === projectId && (m.status !== "done" || String(m.id) === milestoneId));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      title,
      description,
      projectId: projectId || null,
      milestoneId: projectMilestones.some((m) => String(m.id) === milestoneId) ? milestoneId : null,
      status,
      priority,
      dueDate,
      isFocus,
    };
    if (task) {
      run(() => updateTaskAction(task.id, input), { onOk: () => onOpenChange(false) });
    } else {
      run(() => createTaskAction({ ...input, subtasks: draftSubtasks }), {
        success: "任务已创建",
        onOk: () => onOpenChange(false),
      });
    }
  }

  function addSubtask() {
    const text = newSubtask.trim();
    if (!text) return;
    setNewSubtask("");
    if (task) run(() => addSubtaskAction(task.id, text));
    else setDraftSubtasks((s) => [...s, text]);
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="task-title">标题</Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="要做什么？" required autoFocus={!task} maxLength={200} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="task-project">项目</Label>
          <NativeSelect id="task-project" value={projectId} onChange={(e) => { setProjectId(e.target.value); setMilestoneId(""); }}>
            <option value="">无项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-milestone">里程碑</Label>
          <NativeSelect id="task-milestone" value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} disabled={projectMilestones.length === 0}>
            <option value="">无</option>
            {projectMilestones.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-status">状态</Label>
          <NativeSelect id="task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-priority">优先级</Label>
          <NativeSelect id="task-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-due">截止日期</Label>
          <Input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <span className="text-body font-medium">今日重点</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsFocus((v) => !v)}
            aria-pressed={isFocus}
            className={cn("justify-start", isFocus && "border-warning-line text-warning-fg")}
          >
            <Star className={cn(isFocus && "fill-current")} />
            {isFocus ? "已标星" : "标为今日重点"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="task-desc">描述</Label>
        <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="补充说明、链接…" rows={3} />
      </div>

      <div className="grid gap-2">
        <span className="text-body font-medium">子任务</span>
        <ul className="grid gap-1.5">
          {task?.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <Checkbox
                checked={s.done}
                onCheckedChange={(v) => run(() => toggleSubtaskAction(s.id, v === true))}
                aria-label={`完成 ${s.title}`}
              />
              <span className={cn("flex-1 text-body", s.done && "text-fg-muted line-through")}>{s.title}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => run(() => deleteSubtaskAction(s.id))} aria-label="删除子任务">
                <X />
              </Button>
            </li>
          ))}
          {draftSubtasks.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <Checkbox disabled />
              <span className="flex-1 text-body">{s}</span>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setDraftSubtasks((d) => d.filter((_, j) => j !== i))} aria-label="删除子任务">
                <X />
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                addSubtask();
              }
            }}
            placeholder="添加子任务"
            aria-label="新子任务"
          />
          <Button type="button" variant="secondary" size="icon" onClick={addSubtask} aria-label="添加子任务">
            <Plus />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {task ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger-fg"
            onClick={() => {
              if (confirm("确定删除这个任务？")) run(() => deleteTaskAction(task.id), { success: "已删除", onOk: () => onOpenChange(false) });
            }}
          >
            <Trash2 /> 删除
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
          <Button type="submit" disabled={pending || !title.trim()}>{task ? "保存" : "创建"}</Button>
        </div>
      </div>
    </form>
  );
}
