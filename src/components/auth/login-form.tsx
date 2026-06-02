"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  getFirebaseAuthErrorMessage,
  isValidEmail,
  loginWithEmailPassword,
} from "@/lib/firebase/auth";
import { showSuccess, showError } from "@/lib/swal";

export function LoginForm() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!isValidEmail(email)) {
      setError("Masukkan email yang valid.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await loginWithEmailPassword(email.trim(), password);
      await showSuccess("Anda berhasil masuk ke dashboard.", "Login Sukses");
      router.replace("/dashboard");
    } catch (loginError) {
      const errMsg = getFirebaseAuthErrorMessage(loginError);
      setError(errMsg);
      await showError(errMsg, "Login Gagal");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
          htmlFor="password"
          className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--jd-neo-text)]"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <p className="jd-neo-badge jd-neo-badge-red text-xs w-full py-2 flex items-center justify-center font-bold">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-xs">
        <Link href="/forgot-password" className="font-bold text-[var(--jd-neo-text)] underline hover:text-[#8fa882]">
          Lupa password?
        </Link>
      </div>

      <Button type="submit" className="w-full font-black shadow-[3px_3px_0px_rgba(0,0,0,1)]" disabled={isSubmitting || loading}>
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
