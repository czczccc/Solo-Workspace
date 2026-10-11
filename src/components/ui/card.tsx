import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/design-system/components/ui/card";

/** CZ card on Liquid Glass: translucent, blurred, with a specular rim. */
export function Card({ className, interactive, ...props }: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "glass relative flex flex-col rounded-card text-fg",
        interactive && "pressable cursor-pointer transition duration-base ease-standard hover:-translate-y-0.5 hover:glass-float",
        className,
      )}
      {...props}
    />
  );
}
