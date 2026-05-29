"use client";

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { getUserProfileByUid } from "@/lib/firebase/users";
import type { AuthContextValue, UserProfile } from "@/types";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function reloadUserProfile() {
    if (!auth.currentUser) {
      setUserProfile(null);
      return null;
    }

    setProfileLoading(true);

    try {
      const profile = await getUserProfileByUid(auth.currentUser.uid);
      setUserProfile(profile);
      return profile;
    } catch {
      setUserProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const profile = await getUserProfileByUid(currentUser.uid);
        setUserProfile(profile);
      } catch {
        setUserProfile(null);
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userProfile,
      profile: userProfile,
      loading,
      profileLoading,
      isAuthenticated: Boolean(user),
      reloadUserProfile,
    }),
    [loading, profileLoading, user, userProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
