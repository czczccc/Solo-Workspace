"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, FolderKanban, Inbox, LayoutDashboard, Settings, SquareKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/kanban", label: "看板", icon: SquareKanban },
  { href: "/projects", label: "项目", icon: FolderKanban },
  { href: "/inbox", label: "收集", icon: Inbox },
  { href: "/review", label: "周报", icon: CalendarCheck },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1.5 text-caption tabular-nums text-accent-fg">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function Sidebar({ inboxCount }: { inboxCount: number }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 self-start shrink-0 flex-col border-r border-line-subtle bg-canvas px-3 py-5 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-7 rounded-lg" />
        <span className="text-title-sm">Solo Workspace</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex h-control-md items-center gap-3 rounded-control px-3 text-body text-fg-muted transition duration-fast ease-standard hover:bg-hover hover:text-fg",
              isActive(pathname, href) && "bg-selected font-medium text-accent-fg hover:bg-selected hover:text-accent-fg",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {href === "/inbox" && <Count n={inboxCount} />}
          </Link>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t border-line-subtle pt-3">
        <Link
          href="/settings"
          className={cn(
            "flex h-control-md items-center gap-3 rounded-control px-3 text-body text-fg-muted transition duration-fast ease-standard hover:bg-hover hover:text-fg",
            isActive(pathname, "/settings") && "bg-selected text-accent-fg",
          )}
        >
          <Settings className="size-4" /> 设置
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(pathname, n.href))?.label ?? (pathname.startsWith("/settings") ? "设置" : "");
  return (
    <header className="sticky top-0 z-30 border-b bg-canvas/85 pt-safe backdrop-blur md:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <span className="text-title-sm">{current || "Solo Workspace"}</span>
        <div className="flex items-center">
          <ThemeToggle />
          <Link href="/settings" aria-label="设置" className="inline-flex size-control-md items-center justify-center rounded-control text-fg-muted transition duration-fast hover:bg-hover hover:text-fg">
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ inboxCount }: { inboxCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-canvas/90 pb-safe backdrop-blur md:hidden">
      <div className="grid grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-caption text-fg-subtle transition duration-fast",
                active && "text-accent-fg",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              {label}
              {href === "/inbox" && inboxCount > 0 && (
                <span className="absolute left-1/2 top-1 ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-caption tabular-nums text-on-accent">
                  {inboxCount > 99 ? "99+" : inboxCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
