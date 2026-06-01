"use client";

import { AI_QUICK_PROMPTS } from "@/lib/ai-prompts";

type AIQuickPromptsProps = {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function AIQuickPrompts({ disabled = false, onSelect }: AIQuickPromptsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none whitespace-nowrap -mx-1 px-1">
      {AI_QUICK_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className="inline-block rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 px-3.5 py-1.5 transition-colors shrink-0 disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
