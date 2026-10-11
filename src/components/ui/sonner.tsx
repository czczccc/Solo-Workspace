"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme ?? "system") as ToasterProps["theme"]}
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "!rounded-popover !border-line-subtle !bg-raised !text-fg !shadow-lg !text-body !font-sans",
          description: "!text-fg-muted",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
      {...props}
    />
  );
}
