"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { archiveProjectAction, createProjectAction, updateProjectAction } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/use-action";

const COLORS = ["#ec4899", "#0ea5e9", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#6366f1"];

type ProjectValues = { id?: number; name: string; description: string; goal: string; color: string; archived?: boolean };

function ProjectFields({ initial, onDone }: { initial: ProjectValues; onDone: () => void }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [v, setV] = useState(initial);
  const set = (k: keyof ProjectValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const input = { name: v.name, description: v.description, goal: v.goal, color: v.color };
        if (initial.id) run(() => updateProjectAction(initial.id!, input), { success: "已保存", onOk: onDone });
        else
          run(() => createProjectAction(input), {
            success: "项目已创建",
            onOk: (r) => {
              onDone();
              if (r.slug) router.push(`/projects/${r.slug}`);
            },
          });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="p-name">名称</Label>
        <Input id="p-name" value={v.name} onChange={set("name")} required maxLength={80} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-desc">简介</Label>
        <Input id="p-desc" value={v.description} onChange={set("description")} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="p-goal">目标</Label>
        <Textarea id="p-goal" value={v.goal} onChange={set("goal")} rows={3} placeholder="这个阶段要达成什么？" />
      </div>
      <div className="grid gap-2">
        <span className="text-body font-medium">颜色</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`颜色 ${c}`}
              aria-pressed={v.color === c}
              onClick={() => setV((s) => ({ ...s, color: c }))}
              className="size-8 rounded-full transition duration-fast ease-standard aria-pressed:shadow-ring"
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onDone}>取消</Button>
        <Button type="submit" disabled={pending || !v.name.trim()}>保存</Button>
      </div>
    </form>
  );
}

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Plus /> 新项目
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新项目</DialogTitle>
            <DialogDescription className="sr-only">创建项目</DialogDescription>
          </DialogHeader>
          <ProjectFields key={String(open)} initial={{ name: "", description: "", goal: "", color: COLORS[4] }} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditProjectButtons({ project }: { project: Required<ProjectValues> }) {
  const [open, setOpen] = useState(false);
  const { run } = useAction();
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Pencil /> 编辑
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          run(() => archiveProjectAction(project.id, !project.archived), { success: project.archived ? "已恢复" : "已归档" })
        }
      >
        {project.archived ? <ArchiveRestore /> : <Archive />}
        {project.archived ? "恢复" : "归档"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑项目</DialogTitle>
            <DialogDescription className="sr-only">编辑项目信息</DialogDescription>
          </DialogHeader>
          <ProjectFields key={String(open)} initial={project} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
