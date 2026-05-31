"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIInput } from "@/components/ai/ai-input";
import { AIHistoryDateSeparator } from "@/components/ai/ai-history-date-separator";
import { AILoadingMessage } from "@/components/ai/ai-loading-message";
import { AIMessage } from "@/components/ai/ai-message";
import { AIQuickPrompts } from "@/components/ai/ai-quick-prompts";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    void Promise.resolve().then(loadHistory);
  }, [loadHistory]);

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
    <div className="space-y-5">
      <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Quick prompt</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pilih pertanyaan cepat untuk membaca progres terbaru.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={loadHistory} disabled={historyLoading}>
            {historyLoading ? "Memuat..." : "Refresh Riwayat"}
          </Button>
        </div>
        <AIQuickPrompts disabled={loading} onSelect={ask} />
      </div>

      <section className="max-h-[62vh] min-h-[420px] space-y-4 overflow-y-auto rounded-[8px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        {historyLoading ? (
          <div className="rounded-[8px] border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
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
            description="Riwayat chat dari ai_logs akan tampil di sini setelah Anda mengirim pertanyaan."
          />
        )}
        {loading ? <AILoadingMessage /> : null}
        <div ref={chatEndRef} />
      </section>

      {copyMessage ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
          {copyMessage}
        </p>
      ) : null}
      {whatsAppMessage ? (
        <p className="rounded-[8px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
          {whatsAppMessage}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[8px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      <AIInput disabled={loading} onSubmit={ask} />
    </div>
  );
}
