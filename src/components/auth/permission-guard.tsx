"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@/types";

type PermissionGuardProps = {
  children: ReactNode;
  canAccess: (profile: UserProfile) => boolean;
};

export function PermissionGuard({ children, canAccess }: PermissionGuardProps) {
  const router = useRouter();
  const { loading, profileLoading, userProfile } = useAuth();
  const isLoading = loading || profileLoading;
  const allowed = userProfile ? canAccess(userProfile) : false;

  useEffect(() => {
    if (!isLoading && userProfile && !allowed) {
      router.replace("/dashboard/unauthorized");
    }
  }, [allowed, isLoading, router, userProfile]);

  if (isLoading) {
    return <LoadingState title="Memeriksa izin akses..." />;
  }

  if (!userProfile || !allowed) {
    return <LoadingState title="Mengarahkan ke halaman unauthorized..." />;
  }

  return children;
}
