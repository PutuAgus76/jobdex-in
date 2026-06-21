import {
  INFERENCE_RULES,
  getDefaultArchiveSettings,
  CATEGORY_RULES,
} from "./jobdesk-categories";
import type { ReferenceListItem } from "@/types";

export type DetectJobdeskCategoryInput = {
  title: string;
  description?: string;
  eventName?: string;
  existingReferences?: ReferenceListItem[];
};

export type DetectJobdeskCategoryResult = {
  category_key: string | null;
  subcategory_key: string | null;
  archive_enabled: boolean;
  reference_candidate_enabled: boolean;
  data_sensitivity: "public_internal" | "limited" | "sensitive";
  confidence: number;
  source: "rule_based" | "reference_similarity" | "ai_fallback" | "manual_required";
  reason: string;
  matched_keywords?: string[];
  matched_reference_title?: string;
};

export function mapSensitivityToOutput(sensitivity: "normal" | "internal" | "sensitive"): "public_internal" | "limited" | "sensitive" {
  if (sensitivity === "normal") return "public_internal";
  if (sensitivity === "internal") return "limited";
  return "sensitive";
}

export function mapOutputToSensitivity(output: "public_internal" | "limited" | "sensitive"): "normal" | "internal" | "sensitive" {
  if (output === "public_internal") return "normal";
  if (output === "limited") return "internal";
  return "sensitive";
}

// 1. Rule-based keyword detection
export function runRuleBasedDetection(title: string, description: string = ""): DetectJobdeskCategoryResult | null {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  // Try title first
  for (const rule of INFERENCE_RULES) {
    if (titleLower.includes(rule.keyword)) {
      const defaults = getDefaultArchiveSettings(rule.categoryKey, rule.subcategoryKey);
      return {
        category_key: rule.categoryKey,
        subcategory_key: rule.subcategoryKey,
        archive_enabled: defaults.archiveEnabled,
        reference_candidate_enabled: defaults.referenceCandidateEnabled,
        data_sensitivity: mapSensitivityToOutput(defaults.dataSensitivity),
        confidence: 0.95,
        source: "rule_based",
        reason: `Terdeteksi otomatis dari kata kunci "${rule.keyword}" pada judul.`,
        matched_keywords: [rule.keyword],
      };
    }
  }

  // Try description next
  for (const rule of INFERENCE_RULES) {
    if (descLower.includes(rule.keyword)) {
      const defaults = getDefaultArchiveSettings(rule.categoryKey, rule.subcategoryKey);
      return {
        category_key: rule.categoryKey,
        subcategory_key: rule.subcategoryKey,
        archive_enabled: defaults.archiveEnabled,
        reference_candidate_enabled: defaults.referenceCandidateEnabled,
        data_sensitivity: mapSensitivityToOutput(defaults.dataSensitivity),
        confidence: 0.8,
        source: "rule_based",
        reason: `Terdeteksi otomatis dari kata kunci "${rule.keyword}" pada deskripsi.`,
        matched_keywords: [rule.keyword],
      };
    }
  }

  return null;
}

// Helper to resolve category/subcategory keys from reference
function resolveCategoryKeysFromRef(ref: ReferenceListItem): { categoryKey: string | null; subcategoryKey: string | null } {
  const subLabelLower = (ref.subcategory_label || "").toLowerCase();
  const subKeyLower = (ref.subcategory_label || "").toLowerCase();
  const visualType = (ref.visual_type || "").toLowerCase();

  let match = CATEGORY_RULES.find((r) => 
    r.subcategoryKey.toLowerCase() === subKeyLower ||
    r.subcategoryLabel.toLowerCase() === subLabelLower
  );

  if (!match && visualType) {
    match = CATEGORY_RULES.find((r) => 
      r.subcategoryKey.toLowerCase() === visualType ||
      r.subcategoryLabel.toLowerCase() === visualType
    );
  }

  if (match) {
    return { categoryKey: match.categoryKey, subcategoryKey: match.subcategoryKey };
  }

  if (ref.source_type === "manual_reference" && ref.visual_type) {
    const rule = CATEGORY_RULES.find((r) => r.subcategoryKey === ref.visual_type);
    if (rule) {
      return { categoryKey: rule.categoryKey, subcategoryKey: rule.subcategoryKey };
    }
  }

  return { categoryKey: null, subcategoryKey: null };
}

// Helper to calculate similarity score
function calculateSimilarityScore(
  inputTitle: string,
  ref: ReferenceListItem,
  inputEventName?: string
): { score: number; matchedWords: string[] } {
  let score = 0;
  const matchedWords: string[] = [];

  const cleanInput = inputTitle.toLowerCase().trim();
  const cleanRefTitle = ref.title.toLowerCase().trim();

  // 1. Exact match
  if (cleanInput === cleanRefTitle) {
    score += 60;
  }

  // 2. Subcategory keyword match
  const subCategoryTerms = [
    ref.subcategory_label,
    ref.visual_type,
    ref.category_label,
  ].filter((val): val is string => !!val).map(t => t.toLowerCase());

  const inputWords = cleanInput.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, "")).filter(w => w.length > 2);
  const refWords = cleanRefTitle.split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9]/g, "")).filter(w => w.length > 2);

  for (const term of subCategoryTerms) {
    if (inputWords.includes(term) || cleanInput.includes(term)) {
      score += 50;
      matchedWords.push(term);
      break;
    }
  }

  // 3. Token overlap
  const stopWords = ["dan", "yang", "untuk", "dari", "dengan", "atau", "pada", "bisa", "ada", "membuat", "mendesain", "setup", "rapat"];
  const filteredInputWords = inputWords.filter(w => !stopWords.includes(w));
  const filteredRefWords = refWords.filter(w => !stopWords.includes(w));

  const overlaps = filteredInputWords.filter(w => filteredRefWords.includes(w));
  if (overlaps.length > 0) {
    score += 20 * overlaps.length;
    overlaps.forEach(w => matchedWords.push(w));
  }

  // 4. Same event name
  if (inputEventName && ref.event_name && inputEventName.toLowerCase() === ref.event_name.toLowerCase()) {
    score += 5;
  }

  return { score, matchedWords };
}

// 2. Reference-based similarity detection
export function runReferenceSimilarityDetection(
  title: string,
  references: ReferenceListItem[],
  eventName?: string
): DetectJobdeskCategoryResult | null {
  if (!references || references.length === 0) return null;

  let bestRef: ReferenceListItem | null = null;
  let maxScore = 0;

  for (const ref of references) {
    const { score } = calculateSimilarityScore(title, ref, eventName);
    if (score > maxScore) {
      maxScore = score;
      bestRef = ref;
    }
  }

  if (bestRef && maxScore >= 50) {
    const keys = resolveCategoryKeysFromRef(bestRef);
    if (keys.categoryKey && keys.subcategoryKey) {
      const defaults = getDefaultArchiveSettings(keys.categoryKey, keys.subcategoryKey);
      return {
        category_key: keys.categoryKey,
        subcategory_key: keys.subcategoryKey,
        archive_enabled: defaults.archiveEnabled,
        reference_candidate_enabled: defaults.referenceCandidateEnabled,
        data_sensitivity: mapSensitivityToOutput(defaults.dataSensitivity),
        confidence: Math.min(0.95, 0.5 + (maxScore / 200)),
        source: "reference_similarity",
        reason: `Terdeteksi mengikuti pola referensi lama: "${bestRef.title}" (${bestRef.event_name || "-"}).`,
        matched_reference_title: bestRef.title,
      };
    }
  }

  return null;
}
