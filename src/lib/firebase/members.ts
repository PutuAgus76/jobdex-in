import {
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { USER_ROLES } from "@/lib/roles";
import type { MemberUpdateInput, UserProfile } from "@/types";

export async function getMembers() {
  const snapshot = await getDocs(
    query(collection(db, "users"), orderBy("name", "asc")),
  );

  return snapshot.docs.map((item) => item.data() as UserProfile);
}

export async function getUsersByIds(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const snapshots = await Promise.all(
    uniqueIds.map((userId) => getDoc(doc(db, "users", userId))),
  );

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => ({
      id: snapshot.id,
      ...snapshot.data(),
    })) as UserProfile[];
}

export async function updateMember(
  memberId: string,
  input: MemberUpdateInput,
  canUpdateRole: boolean,
) {
  const payload: Record<string, unknown> = {
    name: input.name,
    whatsapp_number: input.whatsapp_number,
    division_id: input.division_id,
    is_active: input.is_active,
    updated_at: serverTimestamp(),
    ...(canUpdateRole ? { role: input.role ?? USER_ROLES.ANGGOTA } : {}),
    ...(input.whatsapp_command_pin !== undefined ? { whatsapp_command_pin: input.whatsapp_command_pin } : {}),
  };

  await updateDoc(doc(db, "users", memberId), payload);
}
