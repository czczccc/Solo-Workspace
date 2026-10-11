"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/lib/auth/password";
import { lockRemaining, recordFailure, recordSuccess } from "@/lib/auth/rate-limit";
import {
  configuredUsername,
  cookieSecure,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";

export type LoginState = { error?: string };

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  const key = `login:${ip}`;

  const locked = lockRemaining(key);
  if (locked > 0) {
    return { error: `尝试次数过多，请 ${Math.ceil(locked / 60000)} 分钟后再试` };
  }

  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const hash = process.env.AUTH_PASSWORD_HASH ?? "";
  if (!hash) return { error: "服务器未配置 AUTH_PASSWORD_HASH" };

  const userOk = safeEqual(username, configuredUsername());
  const passOk = await verifyPassword(password, hash);
  if (!userOk || !passOk) {
    recordFailure(key);
    return { error: "用户名或密码错误" };
  }

  recordSuccess(key);
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(username), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
