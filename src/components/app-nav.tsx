"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarCheck, FolderKanban, Inbox, LayoutDashboard, Settings, SquareKanban } from "lucide-react";
import { transition } from "@/design-system/motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/kanban", label: "看板", icon: SquareKanban },
  { href: "/projects", label: "项目", icon: FolderKanban },
  { href: "/inbox", label: "收集", icon: Inbox },
  { href: "/review", label: "周报", icon: CalendarCheck },
] as const;

const TAB = ["nav-tab"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-soft px-1.5 text-caption tabular-nums text-accent-fg">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function Sidebar({ inboxCount }: { inboxCount: number }) {
  const pathname = usePathname();
  const items = [...NAV, { href: "/settings", label: "设置", icon: Settings }] as const;
  return (
    <aside className="glass glass-float sticky top-3 hidden h-floating w-60 shrink-0 self-start flex-col rounded-2xl px-3 py-5 md:flex">
      <Link href="/" transitionTypes={TAB} className="relative mb-6 flex items-center gap-2 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-7 rounded-lg shadow-sm" />
        <span className="text-title-sm">Solo Workspace</span>
      </Link>
      <nav className="relative flex flex-1 flex-col gap-1">
        {items.map(({ href, label, icon: Icon }, i) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              transitionTypes={TAB}
              className={cn(
                "pressable relative flex h-control-md items-center gap-3 rounded-control px-3 text-body text-fg-muted hover:text-fg",
                active && "font-medium text-accent-fg hover:text-accent-fg",
                i === NAV.length && "mt-auto",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-control bg-selected shadow-xs"
                  transition={transition.layout}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative flex-1">{label}</span>
              {href === "/inbox" && <Count n={inboxCount} />}
            </Link>
          );
        })}
      </nav>
      <div className="relative mt-3 flex items-center justify-between border-t border-line-subtle px-1 pt-3">
        <span className="text-caption text-fg-subtle">主题</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(pathname, n.href))?.label ?? (pathname.startsWith("/settings") ? "设置" : "");
  return (
    <header className="glass glass-strong sticky top-0 z-30 pt-safe md:hidden">
      <div className="relative flex h-12 items-center justify-between px-4">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition.smooth}
          className="text-title-sm"
        >
          {current || "Solo Workspace"}
        </motion.span>
        <div className="flex items-center">
          <ThemeToggle />
          <Link
            href="/settings"
            transitionTypes={TAB}
            aria-label="设置"
            className="pressable inline-flex size-control-md items-center justify-center rounded-full text-fg-muted hover:bg-hover hover:text-fg"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** iOS 26 style floating glass tab bar with a sliding "droplet" behind the active tab. */
export function BottomNav({ inboxCount }: { inboxCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="glass glass-float fixed inset-x-3 bottom-floating z-30 rounded-full p-1 md:hidden" aria-label="主导航">
      <div className="relative grid grid-cols-5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              transitionTypes={TAB}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-caption text-fg-muted",
                active && "text-accent-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-droplet"
                  className="absolute inset-0 rounded-full bg-selected shadow-xs"
                  transition={transition.layout}
                />
              )}
              <motion.span
                className="relative"
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={transition.snappy}
              >
                <Icon className="size-5" strokeWidth={active ? 2.3 : 1.9} />
              </motion.span>
              <span className="relative">{label}</span>
              {href === "/inbox" && inboxCount > 0 && (
                <span className="absolute left-1/2 top-0.5 ml-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-caption tabular-nums text-on-accent shadow-xs">
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
