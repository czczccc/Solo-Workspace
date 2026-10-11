"use client";

import { useState } from "react";
import { Archive, ArrowRightCircle, RotateCcw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { convertInboxAction, deleteInboxAction, setInboxStatusAction } from "@/app/actions/inbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useAction } from "@/components/use-action";
import type { InboxItem, TaskPriority } from "@/lib/db/schema";
import { TASK_PRIORITIES } from "@/lib/db/schema";
import { PRIORITY_LABEL } from "@/lib/labels";

type ProjectOption = { id: number; name: string };

function ConvertDialog({ item, projects, onClose }: { item: InboxItem; projects: ProjectOption[]; onClose: () => void }) {
  const { pending, run } = useAction();
  const [title, setTitle] = useState(item.content.split("\n")[0].slice(0, 200));
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => convertInboxAction(item.id, { title, projectId, priority, dueDate, isFocus }), {
          success: "已转为任务",
          onOk: onClose,
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="cv-title">任务标题</Label>
        <Input id="cv-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="cv-project">项目</Label>
          <NativeSelect id="cv-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">无项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cv-priority">优先级</Label>
          <NativeSelect id="cv-priority" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cv-due">截止日期</Label>
          <Input id="cv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-body">
          <input type="checkbox" checked={isFocus} onChange={(e) => setIsFocus(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          设为今日重点
        </label>
      </div>
      {item.content.includes("\n") && <p className="text-caption text-fg-muted">其余内容会作为任务描述保存。</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
        <Button type="submit" disabled={pending || !title.trim()}>转为任务</Button>
      </div>
    </form>
  );
}

export function InboxList({ items, projects, view }: { items: InboxItem[]; projects: ProjectOption[]; view: string }) {
  const { run } = useAction();
  const [converting, setConverting] = useState<InboxItem | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-body text-fg-muted">
        {view === "open" ? "收集箱是空的。想到什么，随手记下来。" : "这里还没有内容。"}
      </p>
    );
  }

  return (
    <>
      <ul className="grid gap-2" data-testid="inbox-list">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border bg-surface p-3 shadow-xs">
            <p className="whitespace-pre-wrap break-words text-body">{item.content}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-caption text-fg-muted">
                {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: zhCN })}
              </span>
              <div className="flex gap-1">
                {item.status === "open" && (
                  <>
                    <Button size="sm" variant="soft" onClick={() => setConverting(item)}>
                      <ArrowRightCircle /> 转任务
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => run(() => setInboxStatusAction(item.id, "archived"))}>
                      <Archive /> 归档
                    </Button>
                  </>
                )}
                {item.status === "archived" && (
                  <Button size="sm" variant="ghost" onClick={() => run(() => setInboxStatusAction(item.id, "open"))}>
                    <RotateCcw /> 恢复
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="删除"
                  className="text-fg-muted"
                  onClick={() => confirm("删除这条记录？") && run(() => deleteInboxAction(item.id))}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={!!converting} onOpenChange={(o) => !o && setConverting(null)}>
        <DialogContent className="max-h-full overflow-y-auto">
          <DialogHeader>
            <DialogTitle>转为任务</DialogTitle>
            <DialogDescription className="line-clamp-2">{converting?.content}</DialogDescription>
          </DialogHeader>
          {converting && <ConvertDialog key={converting.id} item={converting} projects={projects} onClose={() => setConverting(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
