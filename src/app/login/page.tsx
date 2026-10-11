import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guard";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "登录" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="size-14 rounded-2xl shadow-sm" />
          <div>
            <h1 className="text-heading font-semibold">Solo Workspace</h1>
            <p className="mt-1 text-body text-fg-muted">一个人，三个项目，每天知道该做什么</p>
          </div>
        </div>
        <LoginForm next={typeof next === "string" ? next : "/"} />
      </div>
    </main>
  );
}
