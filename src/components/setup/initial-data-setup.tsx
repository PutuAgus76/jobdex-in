"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  ensureInitialData,
  getInitialSetupStatus,
  type InitialSetupStatus,
} from "@/lib/setup";

export function InitialDataSetup() {
  const [status, setStatus] = useState<InitialSetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");

    try {
      const setupStatus = await getInitialSetupStatus();
      setStatus(setupStatus);
    } catch {
      setError("Gagal membaca status setup. Periksa Firestore Rules.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInitialData() {
    setIsCreating(true);
    setError("");
    setMessage("");

    try {
      const setupStatus = await ensureInitialData();
      setStatus(setupStatus);
      setMessage("Data awal JobDex.in berhasil dibuat atau sudah tersedia.");
    } catch {
      setError("Gagal membuat data awal. Pastikan role Anda super_admin dan rules sudah dipasang.");
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadStatus);
  }, []);

  if (loading) {
    return <LoadingState title="Memeriksa status setup..." />;
  }

  const setupReady = Boolean(status?.organizationExists && status.divisionExists);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>organizations/main_org</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950 dark:text-slate-50">
              {status?.organizationExists ? "Ada" : "Belum ada"}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Dokumen organisasi default untuk instance JobDex.in.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>divisions/humas_media_kreatif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-950 dark:text-slate-50">
              {status?.divisionExists ? "Ada" : "Belum ada"}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Dokumen divisi default Humas dan Media Kreatif.
            </p>
          </CardContent>
        </Card>
      </section>

      {message ? (
        <p className="rounded-[8px] bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <EmptyState
        title={setupReady ? "Data awal sudah siap" : "Data awal belum lengkap"}
        description={
          setupReady
            ? "Organization dan division default sudah tersedia di Firestore."
            : "Klik tombol di bawah untuk membuat data awal. Aksi ini idempotent dan tidak membuat duplikat."
        }
        action={
          <Button
            type="button"
            onClick={handleCreateInitialData}
            disabled={isCreating || setupReady}
          >
            {isCreating ? "Membuat..." : "Buat Data Awal JobDex.in"}
          </Button>
        }
      />
    </div>
  );
}
