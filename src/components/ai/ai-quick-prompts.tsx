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
          className="inline-flex items-center text-xs !font-medium px-3.5 py-1.5 transition-all jd-neo-badge jd-neo-badge-purple hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer uppercase-none"
        >
          <span className="normal-case">{prompt}</span>
        </button>
      ))}
    </div>
  );
}
