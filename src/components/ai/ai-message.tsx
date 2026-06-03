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
          "max-w-[85%] md:max-w-[70%] rounded-base border-2 border-border p-3.5 shadow-shadow transition-all",
          isAssistant
            ? "bg-secondary-background text-foreground"
            : "bg-main text-main-foreground",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider",
              isAssistant ? "text-slate-700 dark:text-slate-300" : "text-main-foreground/80",
            )}
          >
            {authorName ?? (isAssistant ? "AI Assistant" : "Anda")}
          </p>
          {time ? (
            <span
              className={cn(
                "text-[10px] font-bold",
                isAssistant ? "text-slate-600 dark:text-slate-400" : "text-main-foreground/70"
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
            isAssistant ? "text-foreground" : "text-main-foreground",
          )}
        >
          {content}
        </div>
        {isAssistant ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border/10 pt-2.5">
            <button
              type="button"
              onClick={() => onCopy?.(content)}
              className="jd-neo-button text-[11px] py-1 px-2.5 font-bold cursor-pointer"
            >
              Salin
            </button>
            <button
              type="button"
              onClick={() => onSendWhatsApp?.(content)}
              disabled={sendingWhatsApp}
              className="jd-neo-button text-[11px] py-1 px-2.5 font-bold cursor-pointer disabled:opacity-50"
            >
              {sendingWhatsApp ? "Mengirim..." : "Kirim ke WA"}
            </button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
