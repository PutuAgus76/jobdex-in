import { getAdminDb } from "./firebase-admin";
import type { DesignReference } from "@/types";

export function isReferenceSearchQuestion(text: string): boolean {
  const clean = text.toLowerCase().trim();

  // Exclude structured bot commands
  if (
    clean.startsWith("tambah jobdesk") ||
    clean.startsWith("tambah acara") ||
    clean.startsWith("tambah banyak jobdesk") ||
    clean.startsWith("approve task") ||
    clean.startsWith("konfirmasi") ||
    clean.startsWith("batal")
  ) {
    return false;
  }

  const keywords = [
    "referensi",
    "arsip",
    "link drive",
    "drive",
    "canva",
    "poster",
    "pamflet",
    "flyer",
    "feed",
    "nametag",
    "name tag",
    "id card",
    "perlengkapan",
    "audio",
    "sound",
    "video",
    "file",
    "desain",
  ];

  return keywords.some((kw) => clean.includes(kw));
}

function expandKeywords(question: string): string[] {
  const clean = question.toLowerCase();
  const words = clean.split(/\s+/).map((w) => w.trim()).filter(Boolean);
  const expanded = new Set<string>(words);

  const synonymGroups = [
    ["poster", "pamflet", "flyer", "feed", "publikasi"],
    ["nametag", "name tag", "id card", "tanda pengenal"],
    ["audio", "sound", "senam", "mp3", "audio/mpeg", "audio mpeg"],
    ["video", "mp4", "reels", "animasi"],
    ["perlengkapan", "aset", "peralatan"],
  ];

  for (const word of words) {
    for (const group of synonymGroups) {
      if (group.includes(word)) {
        group.forEach((syn) => expanded.add(syn));
      }
    }
  }

  // Handle multi-word synonym groups specifically
  if (clean.includes("name tag")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("id card");
    expanded.add("tanda pengenal");
  }
  if (clean.includes("id card")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("tanda pengenal");
  }
  if (clean.includes("tanda pengenal")) {
    expanded.add("nametag");
    expanded.add("name tag");
    expanded.add("id card");
  }

  return Array.from(expanded);
}

function calculateScore(ref: DesignReference, cleanQuestion: string, keywords: string[]): number {
  let score = 0;

  // 1. Exact title match: +8
  if (ref.title.toLowerCase().trim() === cleanQuestion) {
    score += 8;
  }

  // 2. Title contains keyword: +5
  for (const keyword of keywords) {
    if (ref.title.toLowerCase().includes(keyword)) {
      score += 5;
    }
  }

  // 3. file_inventory.name contains keyword: +5
  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      if (file.name) {
        for (const keyword of keywords) {
          if (file.name.toLowerCase().includes(keyword)) {
            score += 5;
            break; // Score once per matching file
          }
        }
      }
    }
  }

  // 4. event_name contains keyword: +4
  if (ref.event_name) {
    for (const keyword of keywords) {
      if (ref.event_name.toLowerCase().includes(keyword)) {
        score += 4;
      }
    }
  }

  // 5. Year match: +4
  const yearMatch = cleanQuestion.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const yearAsked = parseInt(yearMatch[1], 10);
    if (ref.year === yearAsked) {
      score += 4;
    }
  }

  // 6. category/design_type contains keyword: +3
  for (const keyword of keywords) {
    if (
      (ref.category && ref.category.toLowerCase().includes(keyword)) ||
      (ref.design_type && ref.design_type.toLowerCase().includes(keyword))
    ) {
      score += 3;
    }
  }

  // 7. summary_notes / notes / style_notes contains keyword: +2
  for (const keyword of keywords) {
    if (
      (ref.summary_notes && ref.summary_notes.toLowerCase().includes(keyword)) ||
      (ref.notes && ref.notes.toLowerCase().includes(keyword)) ||
      (ref.style_notes && ref.style_notes.toLowerCase().includes(keyword)) ||
      (ref.file_inventory_notes && ref.file_inventory_notes.toLowerCase().includes(keyword))
    ) {
      score += 2;
    }
  }

  // 8. mime_type contains keyword: +2
  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      if (file.mime_type) {
        for (const keyword of keywords) {
          if (file.mime_type.toLowerCase().includes(keyword)) {
            score += 2;
            break; // Score once per file mime match
          }
        }
      }
    }
  }

  // 9. Requested link type exists: +2
  const asksDrive = cleanQuestion.includes("drive") || cleanQuestion.includes("google drive");
  if (asksDrive && (ref.drive_url || (ref.drive_links && ref.drive_links.length > 0))) {
    score += 2;
  }

  const asksCanva = cleanQuestion.includes("canva");
  if (asksCanva && ref.canva_links && ref.canva_links.length > 0) {
    score += 2;
  }

  const asksDocs = cleanQuestion.includes("docs") || cleanQuestion.includes("document") || cleanQuestion.includes("sheet");
  if (asksDocs && ref.doc_links && ref.doc_links.length > 0) {
    score += 2;
  }

  return score;
}

interface InventoryFile {
  name: string;
  url: string;
  type: "file" | "folder";
  mime_type?: string;
  level?: number;
  parent_folder?: string;
}

function scoreFile(file: InventoryFile, question: string, keywords: string[]): number {
  let score = 0;
  const cleanQ = question.toLowerCase();
  const fileName = (file.name || "").toLowerCase();
  const fileMime = (file.mime_type || "").toLowerCase();
  const fileUrl = (file.url || "").toLowerCase();

  for (const keyword of keywords) {
    if (fileName.includes(keyword)) {
      score += 5;
    }
    if (fileMime.includes(keyword)) {
      score += 2;
    }
  }

  // Boost based on requested file repository types
  if (cleanQ.includes("drive") && (fileUrl.includes("drive.google.com") || fileUrl.includes("drive/folders"))) {
    score += 3;
  }
  if (cleanQ.includes("canva") && fileUrl.includes("canva.com")) {
    score += 3;
  }
  if ((cleanQ.includes("docs") || cleanQ.includes("doc")) && fileUrl.includes("docs.google.com")) {
    score += 3;
  }

  return score;
}

export async function searchDesignReferencesFromQuestion(question: string): Promise<string> {
  const cleanQuestion = question.toLowerCase().trim();
  const keywords = expandKeywords(cleanQuestion);

  const db = getAdminDb();
  const snapshot = await db
    .collection("design_references")
    .where("is_archived", "==", false)
    .get();

  const allReferences: DesignReference[] = [];
  snapshot.forEach((doc) => {
    allReferences.push({ id: doc.id, ...doc.data() } as DesignReference);
  });

  const scored = allReferences
    .map((ref) => ({
      ref,
      score: calculateScore(ref, cleanQuestion, keywords),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (scored.length === 0) {
    return [
      "[JobDex.in Referensi]",
      "",
      `Belum ada arsip yang cocok dengan:`,
      `"${question}"`,
      "",
      "Coba gunakan kata kunci lain:",
      "- poster",
      "- pamflet",
      "- nametag",
      "- feed",
      "- perlengkapan",
      "- audio",
      "- PDK 2025",
    ].join("\n");
  }

  const resultLines = [
    "[JobDex.in Referensi]",
    "",
    `Ditemukan ${scored.length} referensi terkait:`,
    `"${question}"`,
    "",
  ];

  scored.forEach((item, index) => {
    const ref = item.ref;
    const driveUrl = ref.drive_url || (ref.drive_links && ref.drive_links[0]) || "";
    const canvaUrl = ref.canva_links && ref.canva_links[0];
    const docUrl = ref.doc_links && ref.doc_links[0];

    resultLines.push(`${index + 1}. ${ref.title}`);
    resultLines.push(`   Kegiatan: ${ref.event_name || "-"}`);
    resultLines.push(`   Tahun: ${ref.year}`);
    if (driveUrl) resultLines.push(`   Folder Drive: ${driveUrl}`);
    if (canvaUrl) resultLines.push(`   Canva: ${canvaUrl}`);
    if (docUrl) resultLines.push(`   Docs: ${docUrl}`);
    if (ref.style_notes) resultLines.push(`   Style Notes: ${ref.style_notes}`);
    if (ref.notes) resultLines.push(`   Catatan: ${ref.notes}`);

    if (ref.file_inventory && ref.file_inventory.length > 0) {
      const scoredFiles = ref.file_inventory
        .map((file) => ({
          file: file as InventoryFile,
          score: scoreFile(file as InventoryFile, cleanQuestion, keywords),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      if (scoredFiles.length > 0) {
        resultLines.push("   File terkait:");
        scoredFiles.forEach((fileItem) => {
          const f = fileItem.file;
          resultLines.push(`   - ${f.name}`);
          if (f.mime_type) resultLines.push(`     Type: ${f.mime_type}`);
          if (f.url) resultLines.push(`     Link: ${f.url}`);
        });
      }
    }
    resultLines.push(""); // Spacing between references
  });

  return resultLines.join("\n").trim();
}
