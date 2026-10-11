"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-card border bg-surface p-5 shadow-xs">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="username">用户名</Label>
        <Input id="username" name="username" autoComplete="username" autoCapitalize="none" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">密码</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p role="alert" className="text-body text-danger-fg">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "登录中…" : "登录"}
      </Button>
    </form>
  );
}
