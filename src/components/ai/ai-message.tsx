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
            ? "bg-white dark:bg-neutral-850"
            : "bg-[#ffe699] text-neutral-950",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              isAssistant ? "text-slate-500 dark:text-slate-400" : "text-neutral-800",
            )}
          >
            {authorName ?? (isAssistant ? "AI Assistant" : "Anda")}
          </p>
          {time ? (
            <span
              className={cn(
                "text-[10px] font-bold",
                isAssistant ? "text-slate-400 dark:text-slate-500" : "text-neutral-700"
              )}
            >
              {time}
            </span>
          ) : null}
        </div>
        <div
          style={{ overflowWrap: "anywhere" }}
          className={cn(
            "mt-2 whitespace-pre-wrap text-sm leading-6 break-words font-normal",
            isAssistant ? "text-neutral-900 dark:text-slate-100" : "text-neutral-950",
          )}
        >
          {content}
        </div>
        {isAssistant ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
            <button
              type="button"
              onClick={() => onCopy?.(content)}
              className="inline-flex items-center justify-center text-[11px] font-black px-2.5 py-1.5 rounded-lg border-2 border-neutral-950 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-[2px_2px_0px_var(--jd-neo-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--jd-neo-shadow)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_var(--jd-neo-shadow)] transition-all cursor-pointer"
            >
              Salin
            </button>
            <button
              type="button"
              onClick={() => onSendWhatsApp?.(content)}
              disabled={sendingWhatsApp}
              className="inline-flex items-center justify-center text-[11px] font-black px-2.5 py-1.5 rounded-lg border-2 border-neutral-950 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-[2px_2px_0px_var(--jd-neo-shadow)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--jd-neo-shadow)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[0.5px_0.5px_0px_var(--jd-neo-shadow)] transition-all cursor-pointer disabled:opacity-50"
            >
              {sendingWhatsApp ? "Mengirim..." : "Kirim ke WA"}
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
