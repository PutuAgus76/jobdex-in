import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
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
    organization_id: "main_org",
    name,
    email,
    whatsapp_number,
    role: "anggota",
    division_id: "humas_media_kreatif",
    avatar_url: "",
    is_active: true,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function getUserProfile(userId: string) {
  const snapshot = await getDoc(doc(db, "users", userId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function touchUserProfile(userId: string) {
  await updateDoc(doc(db, "users", userId), {
    updated_at: serverTimestamp(),
  });
}
