import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--jd-neo-bg)] text-[var(--jd-neo-text)] px-4 py-10 transition-colors duration-200">
      
      {/* Brand Logo */}
      <div className="mb-6 flex flex-col items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex size-10 items-center justify-center rounded-lg border-2 border-[var(--jd-neo-border)] bg-[var(--jd-neo-yellow)] text-sm font-black text-neutral-900 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-105">
            JD
          </span>
          <div>
            <p className="text-lg font-black tracking-wider text-[var(--jd-neo-text)]">
              JobDex<span className="text-[#8fa882]">.in</span>
            </p>
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--jd-neo-muted)]">
              Humas & Media Kreatif
            </p>
          </div>
        </Link>
      </div>

      <Card className="w-full max-w-md bg-[var(--jd-neo-surface)]">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-black text-[var(--jd-neo-text)]">Login ke Akun</CardTitle>
          <p className="mt-2 text-xs leading-relaxed text-[var(--jd-neo-muted)] font-normal">
            Masuk menggunakan email dan password yang sudah terdaftar.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-xs text-[var(--jd-neo-muted)] font-normal">
            Belum punya akun?{" "}
            <Link href="/register" className="font-bold text-[var(--jd-neo-text)] underline hover:text-[#8fa882]">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
