import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login JobDex.in</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masuk menggunakan email dan password yang sudah terdaftar.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-slate-950">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
