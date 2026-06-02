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
          className="inline-flex items-center text-xs font-bold px-3.5 py-1.5 rounded-lg border-2 border-neutral-950 dark:border-neutral-600 bg-[var(--jd-neo-purple)] text-neutral-950 dark:text-white shadow-[2px_2px_0px_var(--jd-neo-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--jd-neo-shadow)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_var(--jd-neo-shadow)] transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <span className="normal-case">{prompt}</span>
        </button>
      ))}
    </div>
  );
}
