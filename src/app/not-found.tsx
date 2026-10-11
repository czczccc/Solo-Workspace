import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-display font-semibold text-fg-muted">404</p>
      <p className="text-body text-fg-muted">页面不存在</p>
      <Link href="/" className={buttonVariants()}>回到今日</Link>
    </main>
  );
}
