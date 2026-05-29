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
    <div className="space-y-6">
      <section>
        <Badge variant="info">Profil</Badge>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Profil anggota
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Data dasar akun yang tersimpan di Firestore collection users.
        </p>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Informasi akun</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-slate-200">
            {profileRows.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-4"
              >
                <dt className="text-sm font-medium text-slate-500">{label}</dt>
                <dd className="text-sm font-semibold text-slate-950">
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
