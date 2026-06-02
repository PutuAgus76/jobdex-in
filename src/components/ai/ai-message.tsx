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
    <div className={cn("flex my-2", isAssistant ? "justify-start" : "justify-end")}>
      <article
        className={cn(
          "max-w-[85%] md:max-w-[70%] rounded-[12px] border-2 border-neutral-950 dark:border-neutral-700 p-3.5 shadow-[3px_3px_0px_var(--jd-neo-shadow)] transition-all",
          isAssistant
            ? "bg-white dark:bg-neutral-900"
            : "bg-[#ffe699] text-neutral-900 dark:bg-neutral-850 dark:text-white",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              isAssistant ? "text-slate-500 dark:text-slate-400" : "text-neutral-700 dark:text-slate-300",
            )}
          >
            {authorName ?? (isAssistant ? "AI Assistant" : "Anda")}
          </p>
          {time ? (
            <span className={cn("text-[10px] font-semibold", isAssistant ? "text-slate-400" : "text-neutral-600 dark:text-slate-400")}>
              {time}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mt-2 whitespace-pre-wrap text-sm leading-6 break-words [overflow-wrap:anywhere] font-normal",
            isAssistant ? "text-neutral-800 dark:text-neutral-250" : "text-neutral-900 dark:text-white",
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
