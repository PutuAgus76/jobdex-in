"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getFirebaseAuthErrorMessage,
  isValidEmail,
  sendForgotPasswordEmail,
} from "@/lib/firebase/auth";

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
      setSuccessMessage(
        "Email reset password sudah dikirim. Cek inbox atau folder spam.",
      );
    } catch (resetError) {
      setError(getFirebaseAuthErrorMessage(resetError));
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

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-[8px] bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim..." : "Kirim email reset"}
      </Button>
    </form>
  );
}
