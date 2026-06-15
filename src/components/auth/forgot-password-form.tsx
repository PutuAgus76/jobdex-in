"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail } from "lucide-react";
import {
  getFirebaseAuthErrorMessage,
  isValidEmail,
  sendForgotPasswordEmail,
} from "@/lib/firebase/auth";
import { showSuccess, showError } from "@/lib/swal";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setError("Masukkan email yang valid.");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendForgotPasswordEmail(trimmedEmail);
      const msg = "Email reset password sudah dikirim. Cek inbox atau folder spam.";
      setSuccessMessage(msg);
      await showSuccess(msg, "Email Terkirim");
    } catch (resetError) {
      const errMsg = getFirebaseAuthErrorMessage(resetError);
      setError(errMsg);
      await showError(errMsg, "Gagal Mengirim Email");
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

      {error ? (
        <p className="w-full text-center py-2 px-3 text-xs font-semibold text-red-700 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="w-full text-center py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-md">
          {successMessage}
        </p>
      ) : null}

      <Button type="submit" size="md" className="w-full" disabled={isSubmitting}>
        <Mail className="h-4 w-4" />
        {isSubmitting ? "Mengirim..." : "Kirim email reset"}
      </Button>
    </form>
  );
}
