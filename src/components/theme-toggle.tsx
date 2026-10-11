"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { transition } from "@/design-system/motion";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      className={cn("rounded-full", className)}
      onClick={() => setTheme(next)}
      aria-label={`主题：${LABEL[current]}，点击切换为${LABEL[next]}`}
      title={`主题：${LABEL[current]}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={current}
          className="inline-flex"
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={transition.snappy}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <div className="inline-flex rounded-full bg-sunken/70 p-1 shadow-xs" role="radiogroup" aria-label="主题">
      {ORDER.map((t) => {
        const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
        const active = mounted && theme === t;
        return (
          <button
            key={t}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(t)}
            className={cn("pressable relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-body", !active && "text-fg-muted")}
          >
            {active && (
              <motion.span layoutId="theme-pill" className="absolute inset-0 rounded-full bg-surface shadow-sm" transition={transition.layout} />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{LABEL[t]}</span>
          </button>
        );
      })}
    </div>
  );
}
