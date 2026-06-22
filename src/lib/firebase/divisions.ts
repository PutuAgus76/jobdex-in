import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { defaultDivision } from "@/lib/seed-data";
import type { Division, ReferenceLink, UserProfile } from "@/types";

export async function createDefaultDivision() {
  await setDoc(
    doc(db, "divisions", defaultDivision.id),
    {
      ...defaultDivision,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Ambil semua divisi dari Firestore.
 */
export async function getDivisions(): Promise<Division[]> {
  const snap = await getDocs(collection(db, "divisions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Division);
}

/**
 * Ambil satu divisi berdasarkan ID.
 */
export async function getDivisionById(divisionId: string): Promise<Division | null> {
  const snap = await getDoc(doc(db, "divisions", divisionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Division;
}

/**
 * Update Design Kit divisi.
 * - super_admin bisa update semua divisi.
 * - koordinator_divisi hanya bisa update divisinya sendiri (divalidasi di rules + sisi klien).
 */
export async function updateDivisionDesignKit(
  divisionId: string,
  kit: {
    color_palette?: string[];
    visual_direction?: string;
    supergraphic_notes?: string;
    design_reference_links?: ReferenceLink[];
    drive_reference_links?: ReferenceLink[];
    archive_drive_links?: ReferenceLink[];
    notes_for_members?: string;
  },
) {
  await updateDoc(doc(db, "divisions", divisionId), {
    design_kit_color_palette: kit.color_palette ?? [],
    design_kit_visual_direction: kit.visual_direction ?? "",
    design_kit_supergraphic_notes: kit.supergraphic_notes ?? "",
    design_kit_design_reference_links: kit.design_reference_links ?? [],
    design_kit_drive_reference_links: kit.drive_reference_links ?? [],
    design_kit_archive_drive_links: kit.archive_drive_links ?? [],
    design_kit_notes_for_members: kit.notes_for_members ?? "",
    updated_at: serverTimestamp(),
  });
}

/**
 * Cek apakah user boleh edit Design Kit divisi.
 * - super_admin: bisa semua.
 * - koordinator_divisi: hanya divisinya sendiri.
 * - lainnya: tidak bisa.
 */
export function canEditDivisionDesignKit(
  profile: UserProfile | null,
  divisionId: string,
): boolean {
  if (!profile) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role === "koordinator_divisi") {
    return profile.division_id === divisionId;
  }
  return false;
}
