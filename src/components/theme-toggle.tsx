"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

const ORDER = ["light", "dark", "system"] as const;
const LABEL = { light: "亮色", dark: "暗色", system: "跟随系统" } as const;

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const current = (mounted ? theme : "system") as (typeof ORDER)[number];
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(next)}
      aria-label={`主题：${LABEL[current]}，点击切换为${LABEL[next]}`}
      title={`主题：${LABEL[current]}`}
    >
      <Icon />
    </Button>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <div className="inline-flex rounded-lg border bg-sunken p-1" role="radiogroup" aria-label="主题">
      {ORDER.map((t) => {
        const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
        const active = mounted && theme === t;
        return (
          <button
            key={t}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(t)}
            className={`flex items-center gap-1.5 rounded-control px-3 py-1.5 text-body transition ${active ? "bg-surface shadow-xs" : "text-fg-muted"}`}
          >
            <Icon className="size-4" />
            {LABEL[t]}
          </button>
        );
      })}
    </div>
  );
}
