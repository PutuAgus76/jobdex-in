import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  DEFAULT_DIVISION_ID,
  DEFAULT_ORGANIZATION_ID,
} from "@/lib/seed-data";
import type { UserProfile } from "@/types";

export type DashboardSummaryItem = {
  label: string;
  value: number | string;
  description: string;
};

export type DashboardSummary = {
  title: string;
  description: string;
  items: DashboardSummaryItem[];
  setupReady?: boolean;
};

async function safeCount(collectionName: string) {
  try {
    const snapshot = await getCountFromServer(collection(db, collectionName));
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

async function safeQueryCount(collectionName: string, field: string, value: unknown) {
  try {
    const snapshot = await getCountFromServer(
      query(collection(db, collectionName), where(field, "==", value)),
    );
    return snapshot.data().count;
  } catch {
    return 0;
  }
}

async function safeDocsByField(
  collectionName: string,
  field: string,
  value: unknown,
) {
  try {
    const snapshot = await getDocs(
      query(collection(db, collectionName), where(field, "==", value)),
    );

    return snapshot.docs.map((item) => item.data());
  } catch {
    return [];
  }
}

function countWhere(
  docs: Array<Record<string, unknown>>,
  field: string,
  value: unknown,
) {
  return docs.filter((item) => item[field] === value).length;
}

async function safeSetupReady() {
  try {
    const [organizationSnapshot, divisionSnapshot] = await Promise.all([
      getDoc(doc(db, "organizations", DEFAULT_ORGANIZATION_ID)),
      getDoc(doc(db, "divisions", DEFAULT_DIVISION_ID)),
    ]);

    return organizationSnapshot.exists() && divisionSnapshot.exists();
  } catch {
    return false;
  }
}

export async function getDashboardSummary(profile: UserProfile) {
  if (profile.role === "super_admin") {
    const [users, events, tasks, references, setupReady] = await Promise.all([
      safeCount("users"),
      safeCount("events"),
      safeCount("tasks"),
      safeCount("design_references"),
      safeSetupReady(),
    ]);

    return {
      title: "Ringkasan seluruh organisasi",
      description:
        "Pantauan awal untuk anggota, acara, tugas, referensi, dan status setup data.",
      setupReady,
      items: [
        {
          label: "Total anggota",
          value: users,
          description: "Jumlah dokumen di collection users.",
        },
        {
          label: "Total acara",
          value: events,
          description: "Jumlah dokumen di collection events.",
        },
        {
          label: "Total tugas",
          value: tasks,
          description: "Jumlah dokumen di collection tasks.",
        },
        {
          label: "Referensi desain",
          value: references,
          description: "Jumlah dokumen di collection design_references.",
        },
        {
          label: "Setup data awal",
          value: setupReady ? "Siap" : "Belum siap",
          description: "Status organizations/main_org dan divisions/humas_media_kreatif.",
        },
      ],
    } satisfies DashboardSummary;
  }

  if (profile.role === "koordinator_divisi") {
    const divisionId = profile.division_id || DEFAULT_DIVISION_ID;
    const [members, divisionTaskDocs] = await Promise.all([
      safeQueryCount("users", "division_id", divisionId),
      safeDocsByField("tasks", "division_id", divisionId),
    ]);

    return {
      title: "Ringkasan koordinator divisi",
      description:
        "Pantauan awal untuk anggota divisi dan status tugas divisi.",
      items: [
        {
          label: "Total anggota divisi",
          value: members,
          description: "Anggota dengan division_id yang sama.",
        },
        {
          label: "Tugas divisi aktif",
          value: divisionTaskDocs.length,
          description: "Tugas dengan division_id divisi Anda.",
        },
        {
          label: "Tugas stuck",
          value: countWhere(divisionTaskDocs, "status", "stuck"),
          description: "Tugas dengan status stuck.",
        },
        {
          label: "Menunggu approval",
          value: countWhere(divisionTaskDocs, "approval_status", "pending"),
          description: "Tugas dengan approval_status pending.",
        },
      ],
    } satisfies DashboardSummary;
  }

  if (profile.role === "koordinator_acara") {
    const [events, eventTaskDocs] = await Promise.all([
      safeQueryCount("events", "coordinator_id", profile.id),
      safeDocsByField("tasks", "coordinator_id", profile.id),
    ]);

    return {
      title: "Ringkasan koordinator acara",
      description: "Pantauan awal untuk acara dan tugas yang Anda koordinasikan.",
      items: [
        {
          label: "Acara dikoordinasi",
          value: events,
          description: "Acara dengan coordinator_id akun Anda.",
        },
        {
          label: "Tugas acara aktif",
          value: eventTaskDocs.length,
          description: "Tugas dengan coordinator_id akun Anda.",
        },
        {
          label: "Tugas stuck",
          value: countWhere(eventTaskDocs, "status", "stuck"),
          description: "Tugas dengan status stuck.",
        },
        {
          label: "Menunggu approval",
          value: countWhere(eventTaskDocs, "approval_status", "pending"),
          description: "Tugas dengan approval_status pending.",
        },
      ],
    } satisfies DashboardSummary;
  }

  const myTaskDocs = await safeDocsByField("tasks", "pic_id", profile.id);

  return {
    title: "Ringkasan tugas saya",
    description: "Pantauan awal untuk tugas yang ditugaskan ke akun Anda.",
    items: [
      {
        label: "Tugas saya",
        value: myTaskDocs.length,
        description: "Tugas dengan pic_id akun Anda.",
      },
      {
        label: "Belum dimulai",
        value: countWhere(myTaskDocs, "status", "belum_dimulai"),
        description: "Tugas dengan status belum_dimulai.",
      },
      {
        label: "Sedang dikerjakan",
        value: countWhere(myTaskDocs, "status", "sedang_dikerjakan"),
        description: "Tugas dengan status sedang_dikerjakan.",
      },
      {
        label: "Perlu revisi",
        value: countWhere(myTaskDocs, "approval_status", "revisi"),
        description: "Tugas dengan approval_status revisi.",
      },
    ],
  } satisfies DashboardSummary;
}
