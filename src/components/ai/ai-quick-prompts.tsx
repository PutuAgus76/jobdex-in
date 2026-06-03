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
          className="jd-neo-badge jd-neo-badge-purple cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--border)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_var(--border)] transition-all disabled:opacity-50 shrink-0 text-xs font-bold select-none"
        >
          <span className="normal-case">{prompt}</span>
        </button>
      ))}
    </div>
  );
}
