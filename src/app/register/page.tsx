import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Register akun</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Buat akun anggota baru. Role default akan disimpan sebagai anggota.
          </p>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-slate-950">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
