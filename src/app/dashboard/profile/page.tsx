"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { USER_ROLE_LABELS } from "@/lib/roles";

const divisionLabels: Record<string, string> = {
  humas_media_kreatif: "Humas dan Media Kreatif",
};

function formatDate(value: unknown) {
  if (!value || typeof value !== "object" || !("toDate" in value)) {
    return "-";
  }

  const date = (value as { toDate: () => Date }).toDate();
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(date);
}

export default function ProfilePage() {
  const { user, userProfile } = useAuth();

  if (!userProfile) {
    return null;
  }

  const profileRows = [
    ["Nama lengkap", userProfile.name],
    ["Email", userProfile.email || user?.email || "-"],
    ["Nomor WhatsApp", userProfile.whatsapp_number],
    ["Role", USER_ROLE_LABELS[userProfile.role]],
    [
      "Divisi",
      divisionLabels[userProfile.division_id] ?? userProfile.division_id,
    ],
    ["Status akun", userProfile.is_active ? "Aktif" : "Nonaktif"],
    ["Tanggal bergabung", formatDate(userProfile.created_at)],
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <section>
        <Badge variant="info">Profil</Badge>
        <h1 className="mt-3 text-3xl font-bold text-neutral-900 dark:text-white">
          Profil anggota
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Data dasar akun yang tersimpan di Firestore collection users.
        </p>
      </section>

      <Card>
        <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || "User")}&background=95bdff&color=1a1a1a&bold=true&rounded=true&size=128`}
              alt={userProfile.name}
              className="size-12 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
            />
            <div>
              <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white">Informasi Akun</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">Verifikasi data divisi & otorisasi peran</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="divide-y divide-dashed divide-neutral-200 dark:divide-neutral-800">
            {profileRows.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-4 align-middle"
              >
                <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</dt>
                <dd className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
