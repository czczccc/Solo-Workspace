import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { QuickCapture } from "@/components/quick-capture";
import { getDb } from "@/lib/db";
import { listInbox } from "@/lib/data/inbox";
import { listProjects } from "@/lib/data/projects";
import { INBOX_STATUSES, type InboxStatus } from "@/lib/db/schema";
import { INBOX_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { InboxList } from "./inbox-list";

export const metadata: Metadata = { title: "收集箱" };

export default async function InboxPage({ searchParams }: PageProps<"/inbox">) {
  const { view } = await searchParams;
  const status: InboxStatus = INBOX_STATUSES.includes(view as InboxStatus) ? (view as InboxStatus) : "open";
  const db = getDb();
  const items = listInbox(db, status);

  return (
    <PageTransition>
    <div className="mx-auto grid max-w-2xl gap-4">
      <PageHeader title="收集箱" description="先记下来，再决定要不要做" className="mb-0" />
      <QuickCapture />
      <div className="flex gap-1" role="tablist">
        {INBOX_STATUSES.map((s) => (
          <Link
            key={s}
            role="tab"
            aria-selected={s === status}
            href={s === "open" ? "/inbox" : `/inbox?view=${s}`}
            className={cn(
              "rounded-full px-3 py-1 text-body",
              s === status ? "bg-accent text-on-accent" : "text-fg-muted hover:bg-hover",
            )}
          >
            {INBOX_LABEL[s]}
          </Link>
        ))}
      </div>
      <InboxList items={items} projects={listProjects(db).map((p) => ({ id: p.id, name: p.name }))} view={status} />
    </div>
    </PageTransition>
  );
}
