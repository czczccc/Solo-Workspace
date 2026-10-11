"use client";

import { useTransition } from "react";
import { toast } from "sonner";

type Result = { ok: boolean; error?: string };

/** Run a server action in a transition and surface errors as toasts. */
export function useAction() {
  const [pending, start] = useTransition();
  function run<T extends Result>(fn: () => Promise<T>, opts: { success?: string; onOk?: (r: T) => void } = {}) {
    start(async () => {
      try {
        const r = await fn();
        if (!r.ok) {
          toast.error(r.error ?? "操作失败");
          return;
        }
        if (opts.success) toast.success(opts.success);
        opts.onOk?.(r);
      } catch (e) {
        // redirect() from an expired session is surfaced as a thrown navigation; let Next handle it.
        if (e && typeof e === "object" && "digest" in e) throw e;
        toast.error("网络错误，请重试");
      }
    });
  }
  return { pending, run };
}
