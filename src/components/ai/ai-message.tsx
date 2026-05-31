"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AIMessageProps = {
  role: "user" | "assistant";
  content: string;
  authorName?: string;
  time?: string;
  onCopy?: (content: string) => void;
  onSendWhatsApp?: (content: string) => void;
  sendingWhatsApp?: boolean;
};

export function AIMessage({
  role,
  content,
  authorName,
  time,
  onCopy,
  onSendWhatsApp,
  sendingWhatsApp = false,
}: AIMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex", isAssistant ? "justify-start" : "justify-end")}>
      <article
        className={cn(
          "max-w-[86%] rounded-[8px] border p-4 shadow-sm",
          isAssistant
            ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            : "border-slate-900 bg-slate-950 text-white dark:border-slate-700 dark:bg-slate-800",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              isAssistant ? "text-slate-500 dark:text-slate-400" : "text-slate-300",
            )}
          >
            {authorName ?? (isAssistant ? "AI Assistant" : "Anda")}
          </p>
          {time ? (
            <span className={cn("text-xs", isAssistant ? "text-slate-400" : "text-slate-300")}>
              {time}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-2 whitespace-pre-wrap text-sm leading-6",
            isAssistant ? "text-slate-700 dark:text-slate-300" : "text-white",
          )}
        >
          {content}
        </div>
        {isAssistant ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => onCopy?.(content)}>
              Salin Jawaban
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSendWhatsApp?.(content)}
              disabled={sendingWhatsApp}
            >
              {sendingWhatsApp ? "Mengirim..." : "Kirim ke WhatsApp"}
            </Button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
