"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

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
    <form className="sticky bottom-0 bg-[var(--jd-neo-bg)]/90 backdrop-blur py-2 jd-sticky-bottom-safe" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 rounded-base border-2 border-[var(--border)] bg-[var(--secondary-background)] px-4 py-2.5 shadow-[2px_2px_0px_var(--border)] focus-within:ring-2 focus-within:ring-[var(--border)] focus-within:ring-offset-2 transition-all">
        <textarea
          id="ai-question"
          rows={1}
          value={question}
          disabled={disabled}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan progress, deadline, atau referensi desain..."
          className="flex-1 max-h-32 min-h-[24px] resize-none bg-transparent py-1 text-sm text-[var(--foreground)] outline-none disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-base border-2 border-[var(--border)] bg-[var(--main)] text-neutral-950 shadow-[2px_2px_0px_var(--border)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--border)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_var(--border)] transition-all shrink-0 cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[2px_2px_0px_var(--border)]"
          title="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
