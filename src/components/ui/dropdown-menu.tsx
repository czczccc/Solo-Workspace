"use client";

import type { ComponentProps } from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "glass glass-strong glass-float relative z-50 min-w-40 overflow-hidden rounded-popover p-1 text-fg",
          "origin-(--radix-dropdown-menu-content-transform-origin) data-[state=open]:animate-[cz-pop-in_var(--cz-duration-slow)_var(--cz-ease-emphasized)]",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone,
  ...props
}: ComponentProps<typeof DropdownMenuPrimitive.Item> & { tone?: "danger" }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex h-control-md cursor-default select-none items-center gap-2 rounded-sm px-2 text-body outline-none",
        "transition duration-instant data-[highlighted]:bg-hover data-[disabled]:opacity-45 [&_svg]:size-4",
        tone === "danger" && "text-danger-fg",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn("px-2 py-1 text-caption text-fg-subtle", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-line-subtle", className)} {...props} />;
}
