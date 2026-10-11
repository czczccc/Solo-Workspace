"use client";

import { useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { addInboxAction } from "@/app/actions/inbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "@/components/use-action";

export function QuickCapture({ placeholder = "记下一个想法…" }: { placeholder?: string }) {
  const [text, setText] = useState("");
  const { pending, run } = useAction();
  const ref = useRef<HTMLTextAreaElement>(null);

  function save() {
    const content = text.trim();
    if (!content) return;
    run(() => addInboxAction(content), {
      success: "已放入收集箱",
      onOk: () => {
        setText("");
        ref.current?.focus();
      },
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex items-end gap-2"
    >
      <Textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
        }}
        rows={1}
        placeholder={placeholder}
        aria-label="快速记录"
        className="min-h-10 resize-none"
        maxLength={5000}
      />
      <Button type="submit" size="icon" className="size-10 shrink-0" disabled={pending || !text.trim()} aria-label="保存想法">
        <ArrowUp />
      </Button>
    </form>
  );
}
