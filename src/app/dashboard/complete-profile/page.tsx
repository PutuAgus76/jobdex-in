"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  getFirebaseAuthErrorMessage,
  isValidEmail,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/firebase/auth";
import { completeUserProfile } from "@/lib/firebase/users";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { reloadUserProfile, user, userProfile } = useAuth();
  const [name, setName] = useState(userProfile?.name ?? user?.displayName ?? "");
  const [email, setEmail] = useState(userProfile?.email ?? user?.email ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(
    userProfile?.whatsapp_number ?? "",
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const normalizedWhatsapp = normalizeWhatsAppNumber(whatsappNumber);

    if (!trimmedName) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Masukkan email yang valid.");
      return;
    }

    if (!isValidWhatsAppNumber(normalizedWhatsapp)) {
      setError("Nomor WhatsApp wajib dan gunakan format 08xx, 628xx, atau +628xx.");
      return;
    }

    setIsSubmitting(true);

    try {
      await completeUserProfile({
        id: user.uid,
        name: trimmedName,
        email: trimmedEmail,
        whatsapp_number: normalizedWhatsapp,
      });
      await reloadUserProfile();
      router.replace("/dashboard");
    } catch (completeError) {
      setError(getFirebaseAuthErrorMessage(completeError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Lengkapi profil</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Profil Firestore diperlukan sebelum membuka dashboard JobDex.in.
          </p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nama lengkap
              </label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama anggota"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@kampus.ac.id"
              />
            </div>
            <div>
              <label
                htmlFor="whatsapp"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Nomor WhatsApp
              </label>
              <Input
                id="whatsapp"
                value={whatsappNumber}
                onChange={(event) => setWhatsappNumber(event.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            {error ? (
              <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan profil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
