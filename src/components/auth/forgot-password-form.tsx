"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <p className="jd-neo-badge jd-neo-badge-red text-xs w-full py-2 flex items-center justify-center font-bold">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="jd-neo-badge jd-neo-badge-green text-xs w-full py-2 flex items-center justify-center font-bold">
          {successMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full font-black shadow-[3px_3px_0px_rgba(0,0,0,1)]" disabled={isSubmitting}>
        {isSubmitting ? "Mengirim..." : "Kirim email reset"}
      </Button>
    </form>
  );
}
