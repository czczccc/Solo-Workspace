import { cn } from "@/lib/utils";

/** Thin progress track; `color` is a project's own color (user data), defaults to the accent. */
export function Progress({ value, className, color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-sunken", className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-all duration-slow ease-enter"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
