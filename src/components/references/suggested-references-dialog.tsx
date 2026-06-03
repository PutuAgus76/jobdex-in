"use client";

import { useEffect, useState } from "react";
import type { Task, DesignReference } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ExternalLink, Bot, FolderOpen, FileText, Lightbulb } from "lucide-react";
import Link from "next/link";

type SuggestedReferencesDialogProps = {
  open: boolean;
  task: Task;
  eventName: string;
  onClose: () => void;
};

export function SuggestedReferencesDialog({
  open,
  task,
  eventName,
  onClose,
}: SuggestedReferencesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DesignReference[]>([]);

  // Formulate the auto query
  const searchQuery = `carikan referensi desain untuk task "${task.name}" acara "${eventName}"`;

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function fetchReferences() {
      setLoading(true);
      try {
        // Formulate a natural search query term
        const searchTerm = `${task.name} ${eventName}`;
        const response = await fetch(`/api/references/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        if (mounted) {
          setResults(data.results || []);
        }
      } catch (error) {
        console.error("[SuggestedReferencesDialog] Search failed:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchReferences();

    return () => {
      mounted = false;
    };
  }, [open, task.name, eventName]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 overflow-y-auto backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lightbulb className="size-5 text-amber-500 shrink-0" />
              <span>Referensi yang Disarankan</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Menampilkan arsip referensi terdekat untuk mempermudah pengerjaan tugas Anda.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 dark:text-slate-500"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 py-4 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="relative size-10 mx-auto flex items-center justify-center">
                <span className="absolute size-full rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-slate-850 dark:border-t-slate-100 animate-spin"></span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Mencari referensi terbaik dari arsip...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center size-12 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500">
                <Bot className="size-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-350">
                  Tidak ada referensi persis di arsip
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Kami tidak menemukan kecocokan langsung. Anda bisa menanyakan ke AI Assistant untuk mencari keterkaitan cerdas lainnya.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={`/dashboard/ai?q=${encodeURIComponent(searchQuery)}`}
                  passHref
                  legacyBehavior
                >
                  <Button variant="primary" size="sm" className="inline-flex items-center gap-2">
                    <Bot className="size-4" />
                    Tanya AI Assistant
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {results.map((ref) => {
                const driveUrl = ref.drive_url || (ref.drive_links && ref.drive_links[0]) || "";
                const canvaUrl = ref.canva_links && ref.canva_links[0];
                const docUrl = ref.doc_links && ref.doc_links[0];

                return (
                  <div
                    key={ref.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="default" className="text-[9px] uppercase tracking-wider">
                          {ref.year}
                        </Badge>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          {ref.event_name}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                        {ref.title}
                      </h4>
                    </div>

                    {/* Expandable Links */}
                    <div className="grid grid-cols-2 gap-2">
                      {driveUrl && (
                        <a
                          href={driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                        >
                          <FolderOpen className="size-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">Google Drive</span>
                          <ExternalLink className="size-3 shrink-0 ml-auto opacity-50" />
                        </a>
                      )}
                      {canvaUrl && (
                        <a
                          href={canvaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                        >
                          <ExternalLink className="size-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">Canva Link</span>
                          <ExternalLink className="size-3 shrink-0 ml-auto opacity-50" />
                        </a>
                      )}
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                        >
                          <FileText className="size-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">Google Docs</span>
                          <ExternalLink className="size-3 shrink-0 ml-auto opacity-50" />
                        </a>
                      )}
                    </div>

                    {/* Style and notes */}
                    {(ref.style_notes || ref.notes) && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                        {ref.style_notes && (
                          <div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Style Notes:</span>
                            <span>{ref.style_notes}</span>
                          </div>
                        )}
                        {ref.notes && (
                          <div className={ref.style_notes ? "mt-1.5" : ""}>
                            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Catatan:</span>
                            <span>{ref.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between gap-3">
          <Link
            href={`/dashboard/ai?q=${encodeURIComponent(searchQuery)}`}
            passHref
            legacyBehavior
          >
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2 text-xs font-semibold py-2">
              <Bot className="size-4 text-slate-500" />
              Lanjut Tanya AI Assistant
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs font-semibold px-4">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
