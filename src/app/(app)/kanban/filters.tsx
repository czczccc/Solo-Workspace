"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
import { TASK_PRIORITIES } from "@/lib/db/schema";
import { PRIORITY_LABEL } from "@/lib/labels";

export function KanbanFilters({ projects }: { projects: { slug: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Track the latest choice locally: a second change made before the first
  // navigation commits must build on it, not on the stale search params.
  const latest = useRef<URLSearchParams | null>(null);
  const [values, setValues] = useState({ project: params.get("project") ?? "", priority: params.get("priority") ?? "" });

  function set(key: "project" | "priority", value: string) {
    const next = new URLSearchParams(latest.current ?? params);
    if (value) next.set(key, value);
    else next.delete(key);
    latest.current = next;
    setValues((v) => ({ ...v, [key]: value }));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[12rem_8rem]">
      <NativeSelect aria-label="按项目筛选" value={values.project} onChange={(e) => set("project", e.target.value)}>
        <option value="">全部项目</option>
        {projects.map((p) => (
          <option key={p.slug} value={p.slug}>{p.name}</option>
        ))}
      </NativeSelect>
      <NativeSelect aria-label="按优先级筛选" value={values.priority} onChange={(e) => set("priority", e.target.value)}>
        <option value="">全部优先级</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
        ))}
      </NativeSelect>
    </div>
  );
}
