"use client";

import { Button } from "@/components/ui/button";
import { AI_QUICK_PROMPTS } from "@/lib/ai-prompts";

type AIQuickPromptsProps = {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function AIQuickPrompts({ disabled = false, onSelect }: AIQuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {AI_QUICK_PROMPTS.map((prompt) => (
        <Button
          key={prompt}
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
