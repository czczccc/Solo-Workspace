import { BottomNav, MobileHeader, Sidebar } from "@/components/app-nav";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { listInbox } from "@/lib/data/inbox";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireSession();
  const inboxCount = listInbox(getDb(), "open").length;
  return (
    <div className="flex min-h-dvh">
      <Sidebar inboxCount={inboxCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-tabbar pt-4 md:px-8 md:pb-10 md:pt-8">
          {children}
        </main>
      </div>
      <BottomNav inboxCount={inboxCount} />
    </div>
  );
}
