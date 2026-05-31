import "server-only";

import type { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/server/firebase-admin";
import { canManageTask, canReadTask } from "@/lib/permissions";
import type { Task, UserProfile } from "@/types";

export type ServerAuthContext = {
  uid: string;
  profile: UserProfile;
};

export async function getServerAuthContext(request: NextRequest) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw new Error("Token login tidak ditemukan.");
  }

  const decodedToken = await getAdminAuth().verifyIdToken(token);
  const userSnapshot = await getAdminDb()
    .collection("users")
    .doc(decodedToken.uid)
    .get();

  if (!userSnapshot.exists) {
    throw new Error("Profil user tidak ditemukan.");
  }

  const profile = {
    id: userSnapshot.id,
    ...userSnapshot.data(),
  } as UserProfile;

  if (!profile.is_active) {
    throw new Error("Akun Anda dinonaktifkan.");
  }

  return {
    uid: decodedToken.uid,
    profile,
  };
}

export function canUploadTaskResult(profile: UserProfile, task: Task) {
  return canManageTask(profile, task) || task.pic_id === profile.id;
}

export function canTriggerTaskNotification(profile: UserProfile, task: Task) {
  return canReadTask(profile, task);
}
