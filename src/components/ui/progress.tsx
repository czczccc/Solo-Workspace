"use client";

import { motion } from "framer-motion";
import { transition } from "@/design-system/motion";
import { cn } from "@/lib/utils";

/** Thin progress track that fills with a gentle spring; `color` is a project's own color (user data). */
export function Progress({ value, className, color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sunken/70", className)}
    >
      <motion.div
        className="h-full rounded-full bg-accent"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={transition.gentle}
      />
    </div>
  );
}
