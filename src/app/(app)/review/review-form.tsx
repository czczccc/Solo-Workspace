"use client";

import { useMemo, useState } from "react";
import { saveReviewAction } from "@/app/actions/reviews";
import { ProjectDot } from "@/components/tasks/task-meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/use-action";
import { parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

type MetricRow = { projectId: number; name: string; color: string; outputs: string; revenue: string; cost: string };

export function ReviewForm({
  weekStart,
  initial,
  currency,
}: {
  weekStart: string;
  initial: { highlights: string; lessons: string; nextFocus: string; metrics: MetricRow[] };
  currency: string;
}) {
  const { pending, run } = useAction();
  const [highlights, setHighlights] = useState(initial.highlights);
  const [lessons, setLessons] = useState(initial.lessons);
  const [nextFocus, setNextFocus] = useState(initial.nextFocus);
  const [metrics, setMetrics] = useState(initial.metrics);

  const fmt = useMemo(
    () => new Intl.NumberFormat("zh-CN", { style: "currency", currency, maximumFractionDigits: 2 }),
    [currency],
  );
  const revenue = metrics.reduce((s, m) => s + parseMoneyToCents(m.revenue), 0);
  const cost = metrics.reduce((s, m) => s + parseMoneyToCents(m.cost), 0);

  function update(i: number, key: "outputs" | "revenue" | "cost", value: string) {
    setMetrics((list) => list.map((m, j) => (j === i ? { ...m, [key]: value } : m)));
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            saveReviewAction({
              weekStart,
              highlights,
              lessons,
              nextFocus,
              metrics: metrics.map(({ projectId, outputs, revenue, cost }) => ({ projectId, outputs, revenue, cost })),
            }),
          { success: "周报已保存" },
        );
      }}
    >
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
          <CardTitle>产出与收支</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "收入", value: revenue, cls: "text-success-fg" },
              { label: "成本", value: cost, cls: "" },
              { label: "利润", value: revenue - cost, cls: revenue - cost < 0 ? "text-danger-fg" : "text-accent-fg" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-sunken px-1 py-2">
                <div className={cn("truncate text-body-lg font-semibold tabular-nums md:text-title-sm", s.cls)} data-testid={`total-${s.label}`}>
                  {fmt.format(s.value / 100)}
                </div>
                <div className="text-caption text-fg-muted">{s.label}</div>
              </div>
            ))}
          </div>
          {metrics.map((m, i) => (
            <fieldset key={m.projectId} className="grid gap-2 rounded-lg border p-3">
              <legend className="flex items-center gap-2 px-1 text-body font-medium">
                <ProjectDot color={m.color} /> {m.name}
              </legend>
              <Textarea
                aria-label={`${m.name} 产出`}
                value={m.outputs}
                onChange={(e) => update(i, "outputs", e.target.value)}
                placeholder="本周产出：发布了什么、做成了什么"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1">
                  <Label className="text-caption text-fg-muted" htmlFor={`rev-${m.projectId}`}>收入</Label>
                  <Input id={`rev-${m.projectId}`} inputMode="decimal" value={m.revenue} onChange={(e) => update(i, "revenue", e.target.value)} placeholder="0" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-caption text-fg-muted" htmlFor={`cost-${m.projectId}`}>成本</Label>
                  <Input id={`cost-${m.projectId}`} inputMode="decimal" value={m.cost} onChange={(e) => update(i, "cost", e.target.value)} placeholder="0" />
                </div>
              </div>
            </fieldset>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 pb-3">
          <CardTitle>复盘</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rv-highlights">本周亮点</Label>
            <Textarea id="rv-highlights" value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} placeholder="做得好的地方、关键进展" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rv-lessons">问题与教训</Label>
            <Textarea id="rv-lessons" value={lessons} onChange={(e) => setLessons(e.target.value)} rows={3} placeholder="卡在哪里、下次怎么做得更好" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rv-next">下周重点</Label>
            <Textarea id="rv-next" value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} rows={3} placeholder="下周最重要的 3 件事" />
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-tabbar z-10 flex justify-end md:bottom-4">
        <Button type="submit" size="lg" disabled={pending} className="shadow-lg">
          {pending ? "保存中…" : "保存周报"}
        </Button>
      </div>
    </form>
  );
}
