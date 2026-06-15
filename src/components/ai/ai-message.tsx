import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, MessageCircle } from "lucide-react";

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
          "max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-xs transition-all",
          isAssistant
            ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            : "bg-sky-100 dark:bg-sky-950/40 text-slate-900 dark:text-slate-100",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isAssistant ? "text-slate-500 dark:text-slate-400" : "text-sky-600 dark:text-sky-400",
            )}
          >
            {authorName ?? (isAssistant ? "AI Assistant" : "Anda")}
          </p>
          {time ? (
            <span
              className={cn(
                "text-[10px] font-medium",
                isAssistant ? "text-slate-400 dark:text-slate-500" : "text-sky-500/80 dark:text-sky-400/80"
              )}
            >
              {time}
            </span>
          ) : null}
        </div>
        <div
          style={{ overflowWrap: "anywhere" }}
          className="mt-2 whitespace-pre-wrap text-sm leading-6 break-words font-normal"
        >
          {content}
        </div>
        {isAssistant ? (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700 pt-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onCopy?.(content)}
              className="h-7 px-2 text-[10px] font-bold"
            >
              <Copy className="size-3" />
              <span>Salin</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSendWhatsApp?.(content)}
              disabled={sendingWhatsApp}
              className="h-7 px-2 text-[10px] font-bold"
            >
              <MessageCircle className="size-3" />
              <span>{sendingWhatsApp ? "Mengirim..." : "Kirim ke WA"}</span>
            </Button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
