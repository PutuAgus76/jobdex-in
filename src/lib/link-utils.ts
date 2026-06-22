/**
 * link-utils.ts
 * Fase 26A — Utility untuk multi-link Design Kit input.
 *
 * - detectLinkType: deteksi tipe link dari domain
 * - parseLinksFromTextarea: split textarea per baris → ReferenceLink[]
 * - formatLinksToTextarea: ReferenceLink[] → string per baris (untuk tampil di textarea)
 * - buildReferenceLinkFromUrl: buat ReferenceLink dari satu URL
 */

import type { ReferenceLink, ReferenceLinkType } from "@/types";

/**
 * Deteksi tipe link dari URL berdasarkan domain.
 */
export function detectLinkType(url: string): ReferenceLinkType {
  if (!url) return "other";

  try {
    const { hostname, pathname } = new URL(url);

    // Google Docs
    if (hostname.includes("docs.google.com") && pathname.includes("/document/")) {
      return "google_docs";
    }

    // Google Sheets
    if (
      hostname.includes("docs.google.com") &&
      (pathname.includes("/spreadsheets/") || pathname.includes("/presentation/"))
    ) {
      return "google_sheets";
    }

    // Google Drive (files + folders)
    if (
      hostname.includes("drive.google.com") ||
      hostname.includes("docs.google.com")
    ) {
      return "google_drive";
    }

    // Canva
    if (hostname.includes("canva.com")) {
      return "canva";
    }

    // Figma
    if (hostname.includes("figma.com")) {
      return "figma";
    }

    // Pinterest
    if (hostname.includes("pinterest.com") || hostname.includes("pin.it")) {
      return "pinterest";
    }

    // YouTube
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }

    // Website / other
    return "website";
  } catch {
    return "other";
  }
}

/**
 * Buat ReferenceLink dari satu URL.
 */
export function buildReferenceLinkFromUrl(url: string, label?: string): ReferenceLink {
  const normalizedUrl = url.trim();
  const normalizedLabel = label?.trim();

  return {
    id: generateLinkId(),
    url: normalizedUrl,
    type: detectLinkType(normalizedUrl),
    ...(normalizedLabel ? { label: normalizedLabel } : {}),
  };
}

/**
 * Parse textarea multi-baris menjadi array ReferenceLink.
 * - Split by newline
 * - Trim setiap baris
 * - Buang baris kosong
 * - Deteksi tipe otomatis dari domain
 */
export function parseLinksFromTextarea(text: string): ReferenceLink[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((url) => buildReferenceLinkFromUrl(url));
}

/**
 * Format array ReferenceLink menjadi string per baris untuk textarea.
 */
export function formatLinksToTextarea(links: ReferenceLink[] | undefined | null): string {
  if (!links || links.length === 0) return "";
  return links.map((link) => link.url).join("\n");
}

/**
 * Generate random ID untuk ReferenceLink (tidak perlu uuid dependency).
 */
function generateLinkId(): string {
  return `lnk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Validasi URL ringan — hanya cek ada protokol http/https.
 * Tidak throw error, hanya return false jika tidak valid.
 */
export function isValidLinkUrl(url: string): boolean {
  if (!url.trim()) return true; // kosong = valid (tidak wajib)
  try {
    const u = new URL(url.trim());
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

/**
 * Validasi semua URL dalam textarea multi-baris.
 * Return array URL yang tidak valid.
 */
export function getInvalidUrlsFromTextarea(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((url) => !isValidLinkUrl(url));
}

/**
 * Label bahasa Indonesia untuk tipe link.
 */
export function getLinkTypeLabel(type: ReferenceLinkType): string {
  const labels: Record<ReferenceLinkType, string> = {
    google_docs: "Google Docs",
    google_sheets: "Google Sheets/Slides",
    google_drive: "Google Drive",
    canva: "Canva",
    figma: "Figma",
    pinterest: "Pinterest",
    website: "Website",
    youtube: "YouTube",
    other: "Lainnya",
  };
  return labels[type] ?? "Lainnya";
}
