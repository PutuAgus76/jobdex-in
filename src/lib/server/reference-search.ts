import { getAdminDb } from "./firebase-admin";
import type { DesignReference } from "@/types";
import { generateText } from "./ai-provider";
import { WA_LABEL } from "./whatsapp-labels";

export const DESIGN_ASSET_SYNONYMS = {
  pamflet: ["pamflet", "poster", "flyer", "feed", "publikasi", "desain publikasi", "poster acara", "poster kegiatan"],
  poster: ["poster", "pamflet", "flyer", "feed", "publikasi"],
  flyer: ["flyer", "pamflet", "poster", "publikasi"],
  feed: ["feed", "instagram", "post instagram", "publikasi", "poster"],
  spanduk: ["spanduk", "banner", "backdrop"],
  nametag: ["nametag", "name tag", "id card", "kartu panitia"],
  baju: ["baju", "kaos", "t-shirt", "seragam"],
  photobooth: ["photobooth", "photo booth", "frame foto"],
  buku_panduan: ["buku panduan", "guidebook", "manual book", "cover buku"],
  sertifikat: ["sertifikat", "piagam"],
  logo: ["logo", "brand", "identity", "identitas visual"],
  header_form: ["header g-form", "header form", "google form", "gform"]
};

const ASSET_TYPE_GROUPS: Record<string, { synonyms: string[]; excludes: string[] }> = {
  pamflet: {
    synonyms: ["pamflet", "poster", "flyer", "feed", "publikasi", "desain publikasi", "poster acara", "poster kegiatan"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "guidebook", "manual book", "header g-form", "header form", "google form", "gform", "nametag", "name tag", "id card"]
  },
  poster: {
    synonyms: ["poster", "pamflet", "flyer", "feed", "publikasi", "desain publikasi", "poster acara", "poster kegiatan"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "guidebook", "manual book", "header g-form", "header form", "google form", "gform", "nametag", "name tag", "id card"]
  },
  flyer: {
    synonyms: ["flyer", "pamflet", "poster", "publikasi", "desain publikasi"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "guidebook", "manual book", "header g-form", "header form", "google form", "gform", "nametag", "name tag", "id card"]
  },
  feed: {
    synonyms: ["feed", "instagram", "post instagram", "publikasi", "poster"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "guidebook", "manual book", "header g-form", "header form", "google form", "gform", "nametag", "name tag", "id card"]
  },
  spanduk: {
    synonyms: ["spanduk", "banner", "backdrop"],
    excludes: ["baju", "kaos", "nametag", "name tag", "id card", "buku panduan", "guidebook", "logo", "sertifikat"]
  },
  nametag: {
    synonyms: ["nametag", "name tag", "id card", "kartu panitia"],
    excludes: ["pamflet", "poster", "flyer", "feed", "baju", "kaos", "photobooth", "photo booth", "buku panduan", "logo"]
  },
  baju: {
    synonyms: ["baju", "kaos", "t-shirt", "seragam"],
    excludes: ["pamflet", "poster", "flyer", "feed", "photobooth", "photo booth", "buku panduan", "logo", "sertifikat", "nametag", "name tag", "id card"]
  },
  photobooth: {
    synonyms: ["photobooth", "photo booth", "frame foto"],
    excludes: ["pamflet", "poster", "flyer", "feed", "baju", "kaos", "buku panduan", "logo", "sertifikat", "nametag", "name tag", "id card"]
  },
  buku_panduan: {
    synonyms: ["buku panduan", "guidebook", "manual book", "cover buku"],
    excludes: ["pamflet", "poster", "flyer", "feed", "baju", "kaos", "photobooth", "photo booth", "nametag", "name tag", "id card", "logo"]
  },
  sertifikat: {
    synonyms: ["sertifikat", "piagam"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "logo", "nametag", "name tag", "id card"]
  },
  logo: {
    synonyms: ["logo", "brand", "identity", "identitas visual"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "sertifikat", "nametag", "name tag", "id card"]
  },
  header_form: {
    synonyms: ["header g-form", "header form", "google form", "gform"],
    excludes: ["baju", "kaos", "photobooth", "photo booth", "buku panduan", "sertifikat", "nametag", "name tag", "id card"]
  }
};

export interface SearchIntent {
  intent: "reference_search" | "general";
  subtype?: "design_reference_search";
  assetType: string | null;
  expandedAssetTypes: string[];
  excludedAssetTypes: string[];
  year: number | null;
  eventKeyword: string | null;
}

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
    "cari",
    "contoh",
    "logo",
    "sertifikat",
    "baju",
    "kaos",
    "photobooth",
    "spanduk",
    "banner",
    "backdrop",
    "guidebook",
    "panduan",
    "g-form",
    "gform",
    "google form"
  ];

  return keywords.some((kw) => clean.includes(kw));
}

function detectAssetType(cleanQuery: string): string | null {
  // Check exact keys first
  const keys = Object.keys(DESIGN_ASSET_SYNONYMS);
  for (const key of keys) {
    if (cleanQuery.includes(key.replace("_", " "))) {
      return key;
    }
  }

  // Then check values (synonyms)
  for (const key of keys) {
    const synonyms = DESIGN_ASSET_SYNONYMS[key as keyof typeof DESIGN_ASSET_SYNONYMS];
    for (const syn of synonyms) {
      if (cleanQuery.includes(syn)) {
        return key;
      }
    }
  }

  return null;
}

function extractEventKeyword(cleanQuery: string, assetType: string | null): string | null {
  // Remove year
  let text = cleanQuery.replace(/\b(20\d{2})\b/g, "");

  // Remove search triggers
  const triggers = [
    "carikan saya", "carikan", "cari", "contoh", "referensi", "arsip", "link drive", 
    "drive", "canva", "desain", "aset", "file", "umum"
  ];
  for (const trigger of triggers) {
    text = text.replace(new RegExp(`\\b${trigger}\\b`, "g"), "");
  }

  // Remove asset type and synonyms
  if (assetType) {
    const synonyms = DESIGN_ASSET_SYNONYMS[assetType as keyof typeof DESIGN_ASSET_SYNONYMS] || [];
    const allRemovals = [assetType.replace("_", " "), ...synonyms];
    for (const syn of allRemovals) {
      text = text.replace(new RegExp(`\\b${syn}\\b`, "g"), "");
    }
  }

  // Clean up whitespace
  const words = text.split(/\s+/).map(w => w.trim()).filter(w => w.length > 2);

  // Filter out common Indonesian filler words
  const stopWords = ["saya", "yang", "dan", "untuk", "dari", "dengan", "atau", "pada", "bisa", "ada"];
  const filtered = words.filter(w => !stopWords.includes(w));

  return filtered.length > 0 ? filtered[0] : null;
}

export function detectSearchIntent(question: string): SearchIntent {
  const clean = question.toLowerCase().trim();
  const assetType = detectAssetType(clean);

  let expandedAssetTypes: string[] = [];
  let excludedAssetTypes: string[] = [];

  if (assetType && ASSET_TYPE_GROUPS[assetType]) {
    expandedAssetTypes = ASSET_TYPE_GROUPS[assetType].synonyms;
    excludedAssetTypes = ASSET_TYPE_GROUPS[assetType].excludes;
  }

  const yearMatch = clean.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
  const eventKeyword = extractEventKeyword(clean, assetType);
  const isRefQuestion = isReferenceSearchQuestion(question);

  return {
    intent: isRefQuestion ? "reference_search" : "general",
    subtype: isRefQuestion ? "design_reference_search" : undefined,
    assetType,
    expandedAssetTypes,
    excludedAssetTypes,
    year,
    eventKeyword,
  };
}

function matchesAssetType(ref: DesignReference, typeKey: string): boolean {
  const synonyms = DESIGN_ASSET_SYNONYMS[typeKey as keyof typeof DESIGN_ASSET_SYNONYMS] || [typeKey.replace("_", " ")];
  const titleLower = ref.title.toLowerCase();
  const eventLower = (ref.event_name || "").toLowerCase();
  const designTypeLower = (ref.design_type || "").toLowerCase();
  const styleLower = (ref.style_notes || "").toLowerCase();

  if (synonyms.some(syn => titleLower.includes(syn) || designTypeLower.includes(syn) || styleLower.includes(syn) || eventLower.includes(syn))) {
    return true;
  }

  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      const fileNameLower = (file.name || "").toLowerCase();
      if (synonyms.some(syn => fileNameLower.includes(syn))) {
        return true;
      }
    }
  }

  return false;
}

export function calculateReferenceScore(ref: DesignReference, intent: SearchIntent): number {
  let score = 0;
  const titleLower = ref.title.toLowerCase();

  if (!intent.assetType || intent.assetType === "desain") {
    // General design search
    score += 50;
    if (intent.eventKeyword) {
      const ekLower = intent.eventKeyword.toLowerCase();
      if (titleLower.includes(ekLower) || (ref.event_name && ref.event_name.toLowerCase().includes(ekLower))) {
        score += 40;
      }
    }
    if (intent.year && ref.year === intent.year) {
      score += 30;
    }
    return score;
  }

  // 1. Exact asset type match (+100)
  const exactTypeMatch = matchesAssetType(ref, intent.assetType);
  if (exactTypeMatch) {
    score += 100;
  }

  // 2. Synonym match (+80)
  const synonyms = intent.expandedAssetTypes.filter(syn => syn !== intent.assetType);
  let hasSynonymMatch = false;
  if (synonyms.some(syn => titleLower.includes(syn))) {
    hasSynonymMatch = true;
  }
  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      const fileNameLower = (file.name || "").toLowerCase();
      if (synonyms.some(syn => fileNameLower.includes(syn))) {
        hasSynonymMatch = true;
        break;
      }
    }
  }
  if (hasSynonymMatch) {
    score += 80;
  }

  // 3. Special case for pamflet (+70)
  if (intent.assetType === "pamflet") {
    const isPamfletSynonym = ["poster", "flyer", "feed", "publikasi"].some(syn => 
      titleLower.includes(syn) || (ref.event_name && ref.event_name.toLowerCase().includes(syn))
    );
    if (isPamfletSynonym) {
      score += 70;
    }
  }

  // 4. Topic/event keyword match (+40)
  if (intent.eventKeyword) {
    const ekLower = intent.eventKeyword.toLowerCase();
    if (titleLower.includes(ekLower) || (ref.event_name && ref.event_name.toLowerCase().includes(ekLower))) {
      score += 40;
    }
  }

  // 5. Year match (+30)
  if (intent.year && ref.year === intent.year) {
    score += 30;
  }

  // 6. Visual file type match (+20)
  let hasVisualFile = false;
  let hasPdfFile = false;
  if (ref.file_inventory && Array.isArray(ref.file_inventory)) {
    for (const file of ref.file_inventory) {
      const mime = (file.mime_type || "").toLowerCase();
      const name = (file.name || "").toLowerCase();
      if (
        mime.startsWith("image/") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".webp")
      ) {
        hasVisualFile = true;
      }
      if (mime === "application/pdf" || name.endsWith(".pdf")) {
        hasPdfFile = true;
      }
    }
  }
  if (hasVisualFile) {
    score += 20;
  }
  // 7. PDF file type match (+10)
  if (hasPdfFile) {
    score += 10;
  }

  // 8. Latest year boost (+10)
  if (ref.year >= 2025) {
    score += 10;
  }

  // 9. Match only "desain" word (+5)
  const hasDesainWord = titleLower.includes("desain") || (ref.event_name && ref.event_name.toLowerCase().includes("desain"));
  if (hasDesainWord && !exactTypeMatch && !hasSynonymMatch) {
    score += 5;
  }

  // 10. Exclusion penalties
  let isExcluded = false;
  for (const excludedKey of intent.excludedAssetTypes) {
    if (matchesAssetType(ref, excludedKey)) {
      isExcluded = true;
      break;
    }
  }

  if (isExcluded) {
    if (intent.assetType === "pamflet") {
      if (matchesAssetType(ref, "baju")) {
        score -= 90;
      } else if (matchesAssetType(ref, "photobooth")) {
        score -= 80;
      } else if (matchesAssetType(ref, "buku_panduan")) {
        score -= 70;
      } else if (matchesAssetType(ref, "header_form")) {
        score -= 60;
      } else {
        score -= 80;
      }
    } else {
      score -= 80;
    }
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

function getFilePriorityScore(file: InventoryFile, question: string): number {
  if (!file.url) return -100;
  
  let score = 0;
  const name = (file.name || "").toLowerCase();
  const mime = (file.mime_type || "").toLowerCase();
  
  const isVisual = mime.startsWith("image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp");
    
  if (isVisual) {
    score += 50;
  }
  
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
  if (isPdf) {
    score += 30;
  }
  
  const isDoc = name.endsWith(".docx") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");
  if (isDoc) {
    score += 10;
  }

  if (question && name.includes(question)) {
    score += 20;
  }

  return score;
}

function sortReferenceFiles(files: InventoryFile[], question: string): InventoryFile[] {
  return [...files].sort((a, b) => {
    return getFilePriorityScore(b, question) - getFilePriorityScore(a, question);
  });
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text.trim());
  } catch {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match?.[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (err) {
        throw new Error("Failed to parse extracted JSON content: " + (err as Error).message);
      }
    }
    throw new Error("Could not find valid JSON block in response");
  }
}

async function rerankWithDeepSeek(
  question: string,
  candidates: DesignReference[],
  intent: SearchIntent
): Promise<{
  ranked_results: Array<{ id: string; score: number; reason: string }>;
  excluded_results: Array<{ id: string; reason: string }>;
}> {
  const candidateList = candidates.map(c => ({
    id: c.id,
    title: c.title,
    event_name: c.event_name || null,
    design_type: c.design_type,
    year: c.year,
    notes: c.notes || null,
    style_notes: c.style_notes || null,
    files: (c.file_inventory || []).map(f => f.name)
  }));

  const systemPrompt = `You are an AI reference reranker for JobDex.in, an internal task and asset management system for student organizations.
Your task is to rerank and filter candidate reference items based on the user's query and intent.

Analyze the user's search query, identify the target asset type, and rank the candidates by relevance.
Rules:
1. Only choose from the provided list of candidates. Do NOT hallucinate or create new references or files.
2. Prioritize candidates that exactly match the target asset type.
3. If the user asks for a visual publication (e.g., pamflet, poster, flyer, feed, publikasi), prioritize visual references (poster, feed, flyer) and heavily demote or exclude non-relevant assets like clothing (baju/kaos), photobooth, book guidelines (buku panduan), and form headers (header g-form).
4. Do NOT match candidates solely because they contain the word "desain" or "design".
5. Give each selected candidate a score between 0 and 100 representing its relevance.
6. Provide a short, clear reason (in Indonesian) explaining why the candidate is relevant to the query.
7. Return a valid JSON object in the specified format:
{
  "query_intent": "<detected_asset_type>",
  "has_exact_match": <true_or_false>,
  "fallback_reason": "<short description of why exact matches were not found and what fallbacks are used, or null>",
  "ranked_results": [
    {
      "id": "<reference_id>",
      "score": <relevance_score_0_to_100>,
      "reason": "<reason in Indonesian>"
    }
  ],
  "excluded_results": [
    {
      "id": "<reference_id>",
      "reason": "<reason for exclusion in Indonesian>"
    }
  ]
}`;

  const userPrompt = `USER QUERY: "${question}"
DETECTED ASSET TYPE: "${intent.assetType || "desain"}"
EXPANDED SYNONYMS: ${JSON.stringify(intent.expandedAssetTypes)}
EXCLUDED TYPES: ${JSON.stringify(intent.excludedAssetTypes)}

CANDIDATES:
${JSON.stringify(candidateList, null, 2)}

Return the JSON ranking object. Make sure the output is valid JSON and only contains the JSON block.`;

  const aiResult = await generateText({
    systemPrompt,
    prompt: userPrompt,
    feature: "reference_rerank",
    provider: "deepseek",
    useCache: false,
    responseFormat: { type: "json_object" },
    temperature: 0.1,
  });

  const parsed = parseJsonFromText(aiResult.text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid response format");
  }

  return {
    ranked_results: Array.isArray(parsed.ranked_results) ? parsed.ranked_results : [],
    excluded_results: Array.isArray(parsed.excluded_results) ? parsed.excluded_results : [],
  };
}

export async function searchDesignReferencesDetailed(
  question: string
): Promise<{
  answer: string;
  intent: SearchIntent;
  candidateCount: number;
  rerankerProvider: string;
  finalResultCount: number;
  fallbackUsed: boolean;
}> {
  const cleanQuestion = question.toLowerCase().trim();
  const intent = detectSearchIntent(cleanQuestion);

  const db = getAdminDb();
  const snapshot = await db
    .collection("design_references")
    .where("is_archived", "==", false)
    .get();

  const allReferences: DesignReference[] = [];
  snapshot.forEach((doc) => {
    allReferences.push({ id: doc.id, ...doc.data() } as DesignReference);
  });

  const scoredCandidates = allReferences
    .map((ref) => {
      const score = calculateReferenceScore(ref, intent);
      return { ref, score };
    });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // If a specific assetType was requested, we should filter out candidates with negative or low scores (penalties)
  // unless there are no positive score candidates at all
  let finalCandidates = scoredCandidates;
  const positiveCandidates = scoredCandidates.filter(item => item.score > 0);
  if (intent.assetType && positiveCandidates.length > 0) {
    finalCandidates = positiveCandidates;
  }

  const topCandidates = finalCandidates.slice(0, 20);

  let rankedIds: Array<{ id: string; score: number; reason: string }> = [];
  let excludedIds: Array<{ id: string; reason: string }> = [];
  let rerankerProvider = "rule-based";
  let fallbackUsed = false;

  const hasDeepSeekKey = !!process.env.DEEPSEEK_API_KEY;

  if (hasDeepSeekKey && topCandidates.length > 0) {
    try {
      const rerankResult = await rerankWithDeepSeek(question, topCandidates.map(c => c.ref), intent);
      rankedIds = rerankResult.ranked_results || [];
      excludedIds = rerankResult.excluded_results || [];
      rerankerProvider = "deepseek";
    } catch (err) {
      console.error("DeepSeek reranker failed, falling back to rule-based scoring:", err);
      fallbackUsed = true;
      rerankerProvider = "rule-based";
    }
  }

  let finalReferences: Array<{ ref: DesignReference; score: number; reason: string }> = [];

  if (rerankerProvider === "deepseek" && rankedIds.length > 0) {
    const candidatesMap = new Map(topCandidates.map(c => [c.ref.id, c.ref]));
    for (const item of rankedIds) {
      const ref = candidatesMap.get(item.id);
      if (ref) {
        finalReferences.push({
          ref,
          score: item.score,
          reason: item.reason,
        });
      }
    }
  } else {
    const fallbackSlice = topCandidates.slice(0, 3);
    finalReferences = fallbackSlice.map(item => {
      let reason = "Hasil paling relevan berdasarkan pencarian kata kunci.";
      if (intent.assetType && matchesAssetType(item.ref, intent.assetType)) {
        reason = `Sesuai dengan pencarian desain ${intent.assetType.replace("_", " ")}.`;
      } else if (intent.assetType && intent.expandedAssetTypes.some(syn => matchesAssetType(item.ref, syn))) {
        reason = `Referensi ${item.ref.design_type || "desain"} yang relevan dengan ${intent.assetType.replace("_", " ")}.`;
      }
      return {
        ref: item.ref,
        score: item.score,
        reason,
      };
    });
  }

  const displayReferences = finalReferences.slice(0, 3);

  const excludedNames = new Set<string>();
  if (rerankerProvider === "deepseek" && excludedIds.length > 0) {
    const candidatesMap = new Map(topCandidates.map(c => [c.ref.id, c.ref]));
    for (const item of excludedIds) {
      const ref = candidatesMap.get(item.id);
      if (ref) {
        if (matchesAssetType(ref, "baju")) excludedNames.add("baju");
        else if (matchesAssetType(ref, "photobooth")) excludedNames.add("photobooth");
        else if (matchesAssetType(ref, "buku_panduan")) excludedNames.add("buku panduan");
        else if (matchesAssetType(ref, "header_form")) excludedNames.add("header G-Form");
        else if (matchesAssetType(ref, "nametag")) excludedNames.add("nametag");
        else excludedNames.add(ref.design_type || "lainnya");
      }
    }
  } else {
    for (const item of scoredCandidates) {
      if (item.score <= 0) {
        if (matchesAssetType(item.ref, "baju")) excludedNames.add("baju");
        if (matchesAssetType(item.ref, "photobooth")) excludedNames.add("photobooth");
        if (matchesAssetType(item.ref, "buku_panduan")) excludedNames.add("buku panduan");
        if (matchesAssetType(item.ref, "header_form")) excludedNames.add("header G-Form");
        if (matchesAssetType(item.ref, "nametag")) excludedNames.add("nametag");
      }
    }
  }

  let answer = "";
  if (displayReferences.length === 0) {
    answer = [
      WA_LABEL.referensi,
      "",
      `Saya belum menemukan referensi yang cukup relevan untuk “${intent.assetType || question}”.`,
      "Coba tambahkan referensi poster/flyer/pamflet ke dashboard Referensi agar bisa saya cari kembali nanti."
    ].join("\n");
  } else {
    const assetDisplayName = intent.assetType ? intent.assetType.replace("_", " ") : "desain";
    const headerPrefix = intent.assetType 
      ? `Saya mencari referensi yang paling dekat dengan “${intent.expandedAssetTypes.slice(0, 4).join(" / ")}”.`
      : `Saya mencari referensi desain internal.`;

    const isExactMatch = intent.assetType && displayReferences.some(r => matchesAssetType(r.ref, intent.assetType!));

    const resultLines = [
      WA_LABEL.referensi,
      "",
      headerPrefix,
      "",
      isExactMatch 
        ? `Ditemukan ${displayReferences.length} referensi yang paling relevan:`
        : `Saya belum menemukan referensi yang benar-benar spesifik “${assetDisplayName}”.\nNamun, saya menemukan beberapa referensi publikasi visual yang paling mendekati:`,
      "",
    ];

    displayReferences.forEach((item, index) => {
      const ref = item.ref;

      resultLines.push(`${index + 1}. ${ref.title}`);
      resultLines.push(`   Kegiatan: ${ref.event_name || "-"}`);
      resultLines.push(`   Tahun: ${ref.year}`);
      resultLines.push(`   Alasan relevan: ${item.reason}`);
      
      if (ref.file_inventory && ref.file_inventory.length > 0) {
        const sortedFiles = sortReferenceFiles(ref.file_inventory as InventoryFile[], cleanQuestion);
        const filesToDisplay = sortedFiles.slice(0, 2);
        
        if (filesToDisplay.length > 0) {
          resultLines.push("   File:");
          filesToDisplay.forEach(f => {
            resultLines.push(`   - ${f.name}`);
            if (f.mime_type) resultLines.push(`     Type: ${f.mime_type}`);
            if (f.url) resultLines.push(`     Link: ${f.url}`);
          });
          
          if (sortedFiles.length > 2) {
            const remainingCount = sortedFiles.length - 2;
            resultLines.push(`   ...dan ${remainingCount} file lainnya. Buka dashboard Referensi untuk detail lengkap.`);
          }
        }
      }
      
      resultLines.push("");
    });

    if (intent.assetType) {
      const excludedArray = Array.from(excludedNames).map(name => {
        if (name === "poster" || name === "pamflet" || name === "flyer" || name === "feed_ig" || name === "story_ig" || name === "banner") return null;
        return name;
      }).filter(Boolean);

      if (excludedArray.length > 0) {
        resultLines.push("Catatan:");
        resultLines.push(`Saya tidak menampilkan desain ${excludedArray.join(", ")} karena kurang relevan dengan permintaan ${assetDisplayName}.`);
        resultLines.push("");
      }
    }

    answer = resultLines.join("\n").trim();
  }

  return {
    answer,
    intent,
    candidateCount: allReferences.length,
    rerankerProvider,
    finalResultCount: displayReferences.length,
    fallbackUsed,
  };
}

export async function searchDesignReferencesFromQuestion(question: string): Promise<string> {
  const result = await searchDesignReferencesDetailed(question);
  return result.answer;
}
