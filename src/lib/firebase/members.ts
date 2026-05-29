import {
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
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

export async function updateMember(
  memberId: string,
  input: MemberUpdateInput,
  canUpdateRole: boolean,
) {
  const payload = {
    name: input.name,
    whatsapp_number: input.whatsapp_number,
    division_id: input.division_id,
    is_active: input.is_active,
    updated_at: serverTimestamp(),
    ...(canUpdateRole ? { role: input.role ?? USER_ROLES.ANGGOTA } : {}),
  };

  await updateDoc(doc(db, "users", memberId), payload);
}
