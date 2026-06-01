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
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
          className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <Link href="/forgot-password" className="font-semibold text-slate-950 dark:text-slate-50">
          Lupa password?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
