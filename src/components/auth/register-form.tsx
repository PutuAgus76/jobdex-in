"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  getFirebaseAuthErrorMessage,
  isValidEmail,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
  registerWithEmailPassword,
} from "@/lib/firebase/auth";
import { showSuccess, showError } from "@/lib/swal";

export function RegisterForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

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

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Konfirmasi password harus sama.");
      return;
    }

    if (!isValidWhatsAppNumber(normalizedWhatsapp)) {
      setError("Nomor WhatsApp wajib dan gunakan format 08xx, 628xx, atau +628xx.");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerWithEmailPassword({
        name: trimmedName,
        email: trimmedEmail,
        password,
        whatsapp_number: normalizedWhatsapp,
      });
      await showSuccess("Akun Anda berhasil didaftarkan.", "Registrasi Sukses");
      router.replace("/dashboard");
    } catch (registerError) {
      const errMsg = getFirebaseAuthErrorMessage(registerError);
      setError(errMsg);
      await showError(errMsg, "Registrasi Gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Nama lengkap
        </label>
        <Input
          id="name"
          placeholder="Nama anggota"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
        />
      </div>
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="nama@kampus.ac.id"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <label
          htmlFor="whatsapp"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Nomor WhatsApp
        </label>
        <Input
          id="whatsapp"
          placeholder="08xxxxxxxxxx"
          value={whatsappNumber}
          onChange={(event) => setWhatsappNumber(event.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div>
        <label
          htmlFor="password-confirmation"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Konfirmasi password
        </label>
        <Input
          id="password-confirmation"
          type="password"
          placeholder="Ulangi password"
          value={passwordConfirmation}
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          autoComplete="new-password"
        />
      </div>

      {error ? (
        <p className="jd-neo-badge jd-neo-badge-red text-xs w-full py-2 flex items-center justify-center font-bold">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full font-black shadow-[3px_3px_0px_rgba(0,0,0,1)]" disabled={isSubmitting || loading}>
        {isSubmitting ? "Membuat akun..." : "Buat akun"}
      </Button>
    </form>
  );
}
