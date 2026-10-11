"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={(resolvedTheme ?? "system") as ToasterProps["theme"]}
      position="top-center"
      style={{ "--normal-bg": "var(--glass-tint-strong)", "--normal-border": "transparent", "--normal-text": "var(--cz-color-fg)" } as React.CSSProperties}
      toastOptions={{
        classNames: {
          toast: "glass glass-float !rounded-2xl !text-fg !text-body !font-sans",
          description: "!text-fg-muted",
          success: "[&_[data-icon]]:!text-success",
          error: "[&_[data-icon]]:!text-danger",
        },
      }}
      {...props}
    />
  );
}
