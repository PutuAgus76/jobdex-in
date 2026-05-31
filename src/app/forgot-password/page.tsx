import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Masukkan email akunmu untuk menerima link reset password dari
            Firebase Authentication.
          </p>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Ingat password?{" "}
            <Link href="/login" className="font-semibold text-slate-950 dark:text-slate-50">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
