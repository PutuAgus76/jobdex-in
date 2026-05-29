import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { USER_ROLES } from "@/lib/roles";
import {
  DEFAULT_DIVISION_ID,
  DEFAULT_ORGANIZATION_ID,
} from "@/lib/seed-data";
import { db } from "@/lib/firebase/client";
import type { NewUserProfileInput, UserProfile } from "@/types";

export async function createUserProfile({
  id,
  name,
  email,
  whatsapp_number,
}: NewUserProfileInput) {
  const userRef = doc(db, "users", id);

  await setDoc(userRef, {
    id,
    organization_id: DEFAULT_ORGANIZATION_ID,
    name,
    email,
    whatsapp_number,
    role: USER_ROLES.ANGGOTA,
    division_id: DEFAULT_DIVISION_ID,
    avatar_url: "",
    is_active: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function getUserProfileByUid(userId: string) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function completeUserProfile({
  id,
  name,
  email,
  whatsapp_number,
}: NewUserProfileInput) {
  const userRef = doc(db, "users", id);
  const snapshot = await getDoc(userRef);
  const existingCreatedAt = snapshot.exists()
    ? snapshot.data().created_at
    : null;

  await setDoc(
    userRef,
    {
      id,
      organization_id: DEFAULT_ORGANIZATION_ID,
      name,
      email,
      whatsapp_number,
      role: USER_ROLES.ANGGOTA,
      division_id: DEFAULT_DIVISION_ID,
      avatar_url: "",
      is_active: true,
      created_at: existingCreatedAt ?? serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );

  return getUserProfileByUid(id);
}

export async function touchUserProfile(userId: string) {
  await updateDoc(doc(db, "users", userId), {
    updated_at: serverTimestamp(),
  });
}
