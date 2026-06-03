"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIInput } from "@/components/ai/ai-input";
import { AIHistoryDateSeparator } from "@/components/ai/ai-history-date-separator";
import { AILoadingMessage } from "@/components/ai/ai-loading-message";
import { AIMessage } from "@/components/ai/ai-message";
import { AIQuickPrompts } from "@/components/ai/ai-quick-prompts";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { getRecentAILogs } from "@/lib/firebase/ai-logs";
import { getMembers } from "@/lib/firebase/members";
import { formatDateSeparator, formatTime } from "@/lib/date-utils";
import type { AILog, UserProfile } from "@/types";

type AIQueryResponse = {
  answer?: string;
  error?: string;
};

type SendWhatsAppResponse = {
  error?: string;
};

export function AIChat() {
  const { user, userProfile } = useAuth();
  const [logs, setLogs] = useState<AILog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setError("");

    try {
      const [logData, userData] = await Promise.all([
        getRecentAILogs(),
        getMembers().catch(() => (userProfile ? [userProfile] : [])),
      ]);

      setLogs(logData);
      setUsers(userData);
    } catch {
      setError("Gagal memuat riwayat AI. Periksa Firestore Rules.");
    } finally {
      setHistoryLoading(false);
    }
  }, [userProfile]);

  const initialQueryProcessedRef = useRef(false);

  useEffect(() => {
    void Promise.resolve().then(loadHistory);
  }, [loadHistory]);

  useEffect(() => {
    if (typeof window !== "undefined" && !initialQueryProcessedRef.current && user && !historyLoading && !loading) {
      const searchParams = new URLSearchParams(window.location.search);
      const queryParam = searchParams.get("q");
      if (queryParam) {
        initialQueryProcessedRef.current = true;
        setTimeout(() => {
          ask(queryParam);
        }, 300);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, historyLoading, loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs, loading]);

  const usersById = useMemo(
    () => new Map(users.map((item) => [item.id, item])),
    [users],
  );
  const groupedLogs = useMemo(() => {
    const groups: Array<{ label: string; items: AILog[] }> = [];

    for (const log of logs) {
      const label = formatDateSeparator(log.created_at);
      const existingGroup = groups.find((group) => group.label === label);

      if (existingGroup) {
        existingGroup.items.push(log);
      } else {
        groups.push({ label, items: [log] });
      }
    }

    return groups;
  }, [logs]);

  async function ask(question: string) {
    if (!user || loading) {
      return;
    }

    setError("");
    setCopyMessage("");
    setWhatsAppMessage("");
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/ai/query", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const result = (await response.json()) as AIQueryResponse;

      if (!response.ok || !result.answer) {
        throw new Error(result.error ?? "AI Assistant gagal menjawab.");
      }

      setLogs((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          organization_id: userProfile?.organization_id ?? "main_org",
          asked_by: userProfile?.id ?? "web",
          question,
          context_summary: "",
          answer: result.answer ?? "",
          model_used: "gemini-2.5-flash",
          source: "web",
          created_at: new Date(),
        },
      ]);
      void loadHistory();
    } catch (queryError) {
      setError(
        queryError instanceof Error
          ? queryError.message
          : "AI Assistant gagal menjawab.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyAnswer(answer: string) {
    await navigator.clipboard.writeText(answer);
    setCopyMessage("Jawaban disalin ke clipboard.");
  }

  async function sendAnswerToWhatsApp(answer: string) {
    if (!user || sendingWhatsApp) {
      return;
    }

    setError("");
    setWhatsAppMessage("");
    setSendingWhatsApp(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/ai/send-whatsapp", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer }),
      });
      const result = (await response.json()) as SendWhatsAppResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "Jawaban gagal dikirim ke WhatsApp.");
      }

      setWhatsAppMessage("Jawaban AI berhasil dikirim ke WhatsApp.");
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Jawaban gagal dikirim ke WhatsApp.",
      );
    } finally {
      setSendingWhatsApp(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Scrollable Chat Area */}
      <section className="max-h-[68vh] lg:max-h-[72vh] min-h-[460px] space-y-4 overflow-y-auto jd-neo-card bg-[var(--secondary-background)] p-4 dark:bg-neutral-900/30">
        {historyLoading ? (
          <div className="jd-neo-card p-4 text-sm font-normal text-slate-500 bg-white">
            Memuat riwayat chat...
          </div>
        ) : groupedLogs.length ? (
          groupedLogs.map((group) => (
            <div key={group.label} className="space-y-4">
              <AIHistoryDateSeparator label={group.label} />
              {group.items.map((log) => (
                <div key={log.id} className="space-y-3">
                  <AIMessage
                    role="user"
                    content={log.question}
                    authorName={
                      log.source === "whatsapp"
                        ? log.whatsapp_sender ?? "WhatsApp"
                        : usersById.get(log.asked_by)?.name ?? "User JobDex"
                    }
                    time={formatTime(log.created_at)}
                  />
                  <AIMessage
                    role="assistant"
                    content={log.answer}
                    time={formatTime(log.created_at)}
                    onCopy={copyAnswer}
                    onSendWhatsApp={sendAnswerToWhatsApp}
                    sendingWhatsApp={sendingWhatsApp}
                  />
                </div>
              ))}
            </div>
          ))
        ) : (
          <EmptyState
            title="Belum ada percakapan"
            description="Tanyakan progress, deadline, atau referensi desain."
          />
        )}
        {loading ? <AILoadingMessage /> : null}
        <div ref={chatEndRef} />
      </section>

      {/* Copy / Action Alerts */}
      {copyMessage ? (
        <div className="jd-neo-badge jd-neo-badge-green text-xs font-bold w-full py-2 flex items-center justify-center">
          {copyMessage}
        </div>
      ) : null}
      {whatsAppMessage ? (
        <div className="jd-neo-badge jd-neo-badge-green text-xs font-bold w-full py-2 flex items-center justify-center">
          {whatsAppMessage}
        </div>
      ) : null}
      {error ? (
        <div className="jd-neo-badge jd-neo-badge-red text-xs font-bold w-full py-2 flex items-center justify-center">
          {error}
        </div>
      ) : null}

      {/* Quick Prompts & Prompt Input Group (ChatGPT style, anchored at the bottom) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pertanyaan Cepat</span>
          <button
            type="button"
            onClick={loadHistory}
            disabled={historyLoading}
            className="text-[11px] font-bold text-neutral-800 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white transition-colors underline"
          >
            {historyLoading ? "Memuat..." : "Refresh Riwayat"}
          </button>
        </div>
        <AIQuickPrompts disabled={loading} onSelect={ask} />
        <AIInput disabled={loading} onSubmit={ask} />
      </div>
    </div>
  );
}
