import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { fieldClasses } from "@/design-system/components/ui/input";
import { cn } from "@/lib/utils";

/** Native <select> in CZ field styling: uses the OS picker on iPhone. */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn(fieldClasses, "h-control-md appearance-none pl-3 pr-8 text-body")} {...props} />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
}
