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
    <form className="sticky bottom-0 bg-white/95 backdrop-blur dark:bg-slate-900/95 py-2 jd-sticky-bottom-safe" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-slate-450 focus-within:ring-1 focus-within:ring-slate-450 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-slate-700 dark:focus-within:ring-slate-700 transition-all shadow-sm">
        <textarea
          id="ai-question"
          rows={1}
          value={question}
          disabled={disabled}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan progress, deadline, atau referensi desain..."
          className="flex-1 max-h-32 min-h-[24px] resize-none bg-transparent py-1 text-sm text-slate-950 outline-none dark:text-slate-50 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-500 overflow-y-auto"
        />
        <button
          type="submit"
          disabled={disabled || !question.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 shrink-0 disabled:scale-100 disabled:active:scale-100"
          title="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
