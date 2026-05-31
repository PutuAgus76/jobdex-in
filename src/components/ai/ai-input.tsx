"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";

type AIInputProps = {
  disabled?: boolean;
  onSubmit: (question: string) => Promise<void>;
};

export function AIInput({ disabled = false, onSubmit }: AIInputProps) {
  const [question, setQuestion] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuestion = question.trim();

    if (!nextQuestion) {
      return;
    }

    await onSubmit(nextQuestion);
    setQuestion("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className="sticky bottom-0 rounded-[8px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 jd-sticky-bottom-safe" onSubmit={handleSubmit}>
      <textarea
        id="ai-question"
        value={question}
        disabled={disabled}
        onChange={(event) => setQuestion(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Contoh: Task apa saja yang sedang stuck?"
        className="min-h-20 w-full resize-y px-3 py-2 text-sm jd-input"
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">Enter untuk kirim, Shift+Enter untuk baris baru.</p>
        <Button type="submit" disabled={disabled || !question.trim()}>
          {disabled ? "AI berpikir..." : "Kirim"}
        </Button>
      </div>
    </form>
  );
}
