"use client";

import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Round iOS-style checkbox; the tick pops in with the emphasized curve. */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer inline-flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 border-line-strong bg-surface/60",
        "transition duration-fast ease-standard hover:border-accent active:scale-90",
        "outline-none focus-visible:shadow-ring disabled:cursor-not-allowed disabled:opacity-45",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:text-on-accent",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current motion-safe:animate-[check-pop_var(--cz-duration-slow)_var(--cz-ease-emphasized)]">
        <Check className="size-3.5" strokeWidth={3.2} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
