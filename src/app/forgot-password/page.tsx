import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--jd-neo-bg)] text-[var(--jd-neo-text)] px-4 py-10 transition-colors duration-200">
      
      {/* Brand Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex size-10 items-center justify-center rounded-lg border border-sky-600 bg-sky-600 text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105">
            JD
          </span>
          <div>
            <p className="text-lg font-bold tracking-wider text-[var(--jd-neo-text)]">
              JobDex<span className="text-sky-550">.in</span>
            </p>
            <p className="text-[9px] uppercase tracking-wider font-semibold text-[var(--jd-neo-muted)]">
              Humas & Media Kreatif
            </p>
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-[var(--jd-neo-surface)]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-[var(--jd-neo-text)]">Reset Password</CardTitle>
          <p className="mt-2 text-xs leading-relaxed text-[var(--jd-neo-muted)] font-normal">
            Masukkan email akunmu untuk menerima tautan atur ulang kata sandi dari Firebase.
          </p>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-xs text-[var(--jd-neo-muted)] font-normal">
            Ingat password?{" "}
            <Link href="/login" className="font-bold text-[var(--jd-neo-text)] underline hover:text-sky-600">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
