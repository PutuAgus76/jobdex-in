"use client";

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
          "max-w-[78%] md:max-w-[68%] rounded-[12px] border p-3.5 shadow-sm transition-all",
          isAssistant
            ? "border-slate-100 bg-white dark:border-slate-800/80 dark:bg-slate-900/40"
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
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
            <button
              type="button"
              onClick={() => onCopy?.(content)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Salin
            </button>
            <button
              type="button"
              onClick={() => onSendWhatsApp?.(content)}
              disabled={sendingWhatsApp}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-2.5 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {sendingWhatsApp ? "Mengirim..." : "Kirim ke WA"}
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
