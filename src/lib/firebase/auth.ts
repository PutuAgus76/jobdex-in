import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { createUserProfile } from "@/lib/firebase/users";
import {
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";
import type { RegisterInput } from "@/types";

export { isValidWhatsAppNumber, normalizeWhatsAppNumber };

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Email sudah terdaftar.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/invalid-credential": "Email atau password tidak sesuai.",
    "auth/user-not-found": "Akun dengan email tersebut belum terdaftar.",
    "auth/wrong-password": "Password tidak sesuai.",
    "auth/weak-password": "Password minimal 8 karakter.",
    "auth/network-request-failed":
      "Koneksi bermasalah. Coba lagi beberapa saat.",
  };

  return messages[code] ?? "Terjadi kesalahan. Silakan coba lagi.";
}

export async function registerWithEmailPassword(input: RegisterInput) {
  await setPersistence(auth, browserLocalPersistence);

  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );

  await updateProfile(credential.user, {
    displayName: input.name,
  });

  await createUserProfile({
    id: credential.user.uid,
    name: input.name,
    email: input.email,
    whatsapp_number: input.whatsapp_number,
  });

  return credential.user;
}

export async function loginWithEmailPassword(email: string, password: string) {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function sendForgotPasswordEmail(email: string) {
  await sendPasswordResetEmail(auth, email);
}
