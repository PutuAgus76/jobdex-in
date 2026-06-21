import type { DesignType, Task } from "@/types";

export function mapTaskSubcategoryToDesignType(subcategoryKey?: string): DesignType {
  if (!subcategoryKey) return "lainnya";
  const key = subcategoryKey.toLowerCase();
  if (key === "poster") return "poster";
  if (key === "name_tag" || key === "id_card" || key === "kartu_panitia" || key === "badge_peserta") return "name_tag";
  if (key === "twibbon") return "twibbon";
  if (key.includes("feed")) return "feed_ig";
  if (key.includes("story")) return "story_ig";
  if (key.includes("banner") || key.includes("spanduk") || key.includes("backdrop") || key.includes("baliho")) return "banner";
  if (key === "sertifikat" || key === "piagam") return "sertifikat";
  if (key.includes("foto") || key.includes("dokumentasi")) return "dokumentasi";
  if (key.includes("video") || key.includes("animasi")) return "animasi";
  if (key.includes("merchandise") || key.includes("kaos") || key.includes("baju") || key.includes("plakat")) return "merchandise";
  return "lainnya";
}

export function isTaskReferenceEligible(task: Partial<Task>, uploadsCount: number): boolean {
  // 1. isApprovedTask
  const isApproved = task.status === "approved" || task.approval_status === "approved";
  if (!isApproved) return false;

  // 2. hasReferenceOutput
  const hasOutput = 
    !!task.result_design_url || 
    !!task.source_link || 
    uploadsCount > 0;
  if (!hasOutput) return false;

  // 3. isReferenceEligible
  if (task.reference_candidate_enabled === false) {
    return false;
  }

  if (task.reference_candidate_enabled === true || task.archive_enabled === true) {
    return true;
  }

  // Jika field belum ada (undefined) - Data lama
  if (task.reference_candidate_enabled === undefined) {
    // Check if it has a design category
    const isDesignCategory = 
      task.category_key === "desain_publikasi" ||
      task.category_key === "identitas_acara_dan_panitia" ||
      task.category_key === "aset_desain";
      
    if (isDesignCategory) {
      return true;
    }

    // Check if title contains design keywords
    const titleLower = (task.name || "").toLowerCase();
    const designKeywords = ["poster", "spanduk", "banner", "nametag", "piagam", "feed", "story", "desain"];
    const hasDesignKeyword = designKeywords.some((kw) => titleLower.includes(kw));
    
    if (hasDesignKeyword) {
      return true;
    }
  }

  return false;
}
