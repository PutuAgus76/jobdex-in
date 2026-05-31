"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isUserProfileComplete } from "@/lib/permissions";

const COMPLETE_PROFILE_PATH = "/dashboard/complete-profile";
const UNAUTHORIZED_PATH = "/dashboard/unauthorized";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, profileLoading, user, userProfile } = useAuth();
  const isCompleteProfilePage = pathname === COMPLETE_PROFILE_PATH;
  const isUnauthorizedPage = pathname === UNAUTHORIZED_PATH;
  const profileIsComplete = isUserProfileComplete(userProfile);

  useEffect(() => {
    if (loading || profileLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!profileIsComplete && !isCompleteProfilePage) {
      router.replace(COMPLETE_PROFILE_PATH);
      return;
    }

    if (
      profileIsComplete &&
      userProfile?.is_active === false &&
      !isUnauthorizedPage
    ) {
      router.replace(UNAUTHORIZED_PATH);
      return;
    }

    if (profileIsComplete && isCompleteProfilePage) {
      router.replace("/dashboard");
    }
  }, [
    isCompleteProfilePage,
    isUnauthorizedPage,
    loading,
    profileIsComplete,
    profileLoading,
    router,
    user,
    userProfile?.is_active,
  ]);

  if (loading || profileLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-slate-950 px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            Memeriksa sesi...
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Kamu akan diarahkan ke login jika belum masuk.
          </p>
        </div>
      </div>
    );
  }

  if (!profileIsComplete && !isCompleteProfilePage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-slate-950 px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            Mengarahkan ke lengkapi profil...
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Data profil diperlukan sebelum membuka dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (profileIsComplete && userProfile?.is_active === false && !isUnauthorizedPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] dark:bg-slate-950 px-4 text-center">
        <div>
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            Akun Anda dinonaktifkan.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Kamu akan diarahkan ke halaman akses dibatasi.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
