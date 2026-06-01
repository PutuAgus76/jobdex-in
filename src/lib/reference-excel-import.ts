import * as XLSX from "xlsx";
import type { DesignReferenceInput, DesignType } from "@/types";

export interface ExcelRow {
  level: number;
  type: string;
  name: string;
  url: string;
  parentFolder: string;
  mimeType: string;
}

export interface ImportOptions {
  mode: "per_row" | "per_parent_folder" | "one_large_archive";
  scope: "divisi" | "acara";
  event_id?: string;
  event_name?: string;
  year?: number;
  categoryDefault?: "divisi" | "acara" | "canva" | "drive" | "video" | "dokumen" | "lainnya";
  notesDefault?: string;
  styleNotesDefault?: string;
}

export function parseReferenceExcelFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function normalizeExcelRows(rows: Record<string, unknown>[]): ExcelRow[] {
  return rows.map((row) => {
    let level = 0;
    let type = "File";
    let name = "";
    let url = "";
    let parentFolder = "";
    let mimeType = "";

    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toLowerCase().replace(/[\s_-]/g, "");
      const val = row[key];

      if (normalizedKey === "level") {
        level = parseInt(String(val), 10) || 0;
      } else if (normalizedKey === "type") {
        type = String(val).trim();
      } else if (normalizedKey === "name" || normalizedKey === "title" || normalizedKey === "nama") {
        name = String(val).trim();
      } else if (normalizedKey === "url" || normalizedKey === "link" || normalizedKey === "tautan") {
        url = String(val).trim();
      } else if (normalizedKey === "parentfolder" || normalizedKey === "folderinduk" || normalizedKey === "parent") {
        parentFolder = String(val).trim();
      } else if (normalizedKey === "mimetype" || normalizedKey === "mime") {
        mimeType = String(val).trim();
      }
    }

    return { level, type, name, url, parentFolder, mimeType };
  }).filter((row) => row.name || row.url);
}

export function groupDriveTreeRows(rows: ExcelRow[]): Record<string, ExcelRow[]> {
  const groups: Record<string, ExcelRow[]> = {};
  for (const row of rows) {
    const parent = row.parentFolder || "";
    if (!groups[parent]) {
      groups[parent] = [];
    }
    groups[parent].push(row);
  }
  return groups;
}

function guessDesignType(name: string, mimeType: string): DesignType {
  const lcName = name.toLowerCase();
  const lcMime = mimeType.toLowerCase();

  if (lcName.includes("feed") || lcName.includes("instagram")) return "feed_ig";
  if (lcName.includes("story")) return "story_ig";
  if (lcName.includes("twibbon")) return "twibbon";
  if (lcName.includes("banner") || lcName.includes("spanduk")) return "banner";
  if (lcName.includes("sertifikat") || lcName.includes("certificate")) return "sertifikat";
  if (lcName.includes("logo") || lcName.includes("maskot")) return "merchandise";
  if (lcName.includes("name tag") || lcName.includes("nametag")) return "name_tag";
  if (lcMime.includes("image")) return "poster";
  if (lcMime.includes("video") || lcName.includes("video")) return "animasi";

  return "lainnya";
}

function categorizeLink(url: string) {
  if (!url) return { type: "other", url: "" };

  if (url.includes("drive.google.com")) {
    return { type: "drive", url };
  } else if (url.includes("canva.com")) {
    return { type: "canva", url };
  } else if (
    url.includes("docs.google.com/document") ||
    (url.includes("docs.google.com") && url.includes("/d/"))
  ) {
    if (url.includes("/document/")) {
      return { type: "doc", url };
    }
    return { type: "drive", url };
  }
  return { type: "other", url };
}

function distributeLinks(urls: string[]) {
  const drive_links: string[] = [];
  const canva_links: string[] = [];
  const doc_links: string[] = [];
  const other_links: string[] = [];

  for (const url of urls) {
    if (!url) continue;
    const cat = categorizeLink(url);
    if (cat.type === "drive") {
      drive_links.push(cat.url);
    } else if (cat.type === "canva") {
      canva_links.push(cat.url);
    } else if (cat.type === "doc") {
      doc_links.push(cat.url);
    } else {
      other_links.push(cat.url);
    }
  }

  return { drive_links, canva_links, doc_links, other_links };
}

export function convertDriveTreeToReferenceItems(
  rows: ExcelRow[],
  options: ImportOptions,
): DesignReferenceInput[] {
  if (options.mode === "per_row") {
    return rows.map((row) => {
      const { drive_links, canva_links, doc_links, other_links } = distributeLinks([row.url]);

      let fileInventoryNotes = `Informasi Item:\n`;
      fileInventoryNotes += `- Nama: ${row.name}\n`;
      fileInventoryNotes += `- Tipe: ${row.type}\n`;
      if (row.parentFolder) fileInventoryNotes += `- Folder Induk: ${row.parentFolder}\n`;
      if (row.mimeType) fileInventoryNotes += `- Mime Type: ${row.mimeType}\n`;

      const file_inventory = [{
        name: row.name,
        url: row.url,
        type: row.type.trim().toLowerCase() === "folder" ? ("folder" as const) : ("file" as const),
        mime_type: row.mimeType,
        level: row.level,
        parent_folder: row.parentFolder,
      }];

      return {
        title: row.name || "Arsip Tanpa Judul",
        scope: options.scope,
        event_id: options.event_id || "",
        event_name: options.event_name || "",
        year: options.year || new Date().getFullYear(),
        design_type: guessDesignType(row.name, row.mimeType),
        drive_url: row.url || "",
        thumbnail_url: "",
        style_notes: options.styleNotesDefault || "",
        color_palette: [],
        notes: options.notesDefault || "",

        category: options.categoryDefault || (row.type === "Folder" ? "drive" : "lainnya"),
        drive_links,
        canva_links,
        doc_links,
        other_links,
        summary_notes: `Impor Per Baris dari Drive Tree.`,
        file_inventory_notes: fileInventoryNotes.trim(),
        file_inventory,
      };
    });
  }

  if (options.mode === "per_parent_folder") {
    interface FolderGroup {
      name: string;
      url: string;
      level: number;
      parentFolder: string;
      files: ExcelRow[];
    }

    const folderMap: Record<string, FolderGroup> = {};

    // 1. Map all folders to folderMap keyed by their absolute folderPath path
    for (const row of rows) {
      if (row.type.trim().toLowerCase() === "folder") {
        const folderPath = row.parentFolder
          ? `${row.parentFolder} / ${row.name}`
          : row.name;

        folderMap[folderPath] = {
          name: row.name,
          url: row.url,
          level: row.level,
          parentFolder: row.parentFolder,
          files: [],
        };
      }
    }

    // 2. Map all files to their parent folders
    const fallbackGroup: FolderGroup = {
      name: "Root Files & Folders",
      url: "",
      level: 0,
      parentFolder: "",
      files: [],
    };

    for (const row of rows) {
      if (row.type.trim().toLowerCase() === "file") {
        const parentPath = row.parentFolder || "";
        if (parentPath && folderMap[parentPath]) {
          folderMap[parentPath].files.push(row);
        } else {
          fallbackGroup.files.push(row);
        }
      }
    }

    // 3. Compile folders that have child files (or fallback if files exist)
    const groupsToImport: FolderGroup[] = [];
    for (const path of Object.keys(folderMap)) {
      const folder = folderMap[path];
      if (folder.files.length > 0) {
        groupsToImport.push(folder);
      }
    }

    if (fallbackGroup.files.length > 0) {
      groupsToImport.push(fallbackGroup);
    }

    // 4. Map to DesignReferenceInput
    return groupsToImport.map((folder) => {
      const totalFiles = folder.files.length;
      const audioCount = folder.files.filter((f) => (f.mimeType || "").toLowerCase().includes("audio")).length;
      const videoCount = folder.files.filter((f) => (f.mimeType || "").toLowerCase().includes("video")).length;
      const imageCount = folder.files.filter((f) => (f.mimeType || "").toLowerCase().includes("image")).length;
      const docCount = folder.files.filter(
        (f) =>
          (f.mimeType || "").toLowerCase().includes("document") ||
          (f.mimeType || "").toLowerCase().includes("pdf") ||
          (f.mimeType || "").toLowerCase().includes("sheet")
      ).length;

      const summaryParts = [
        `Total file: ${totalFiles}`,
        folder.parentFolder ? `Path: ${folder.parentFolder} / ${folder.name}` : `Path: ${folder.name}`,
      ];

      const fileTypes: string[] = [];
      if (audioCount > 0) fileTypes.push(`${audioCount} audio`);
      if (videoCount > 0) fileTypes.push(`${videoCount} video`);
      if (imageCount > 0) fileTypes.push(`${imageCount} image`);
      if (docCount > 0) fileTypes.push(`${docCount} dokumen`);
      const otherCount = totalFiles - (audioCount + videoCount + imageCount + docCount);
      if (otherCount > 0) fileTypes.push(`${otherCount} lainnya`);

      if (fileTypes.length > 0) {
        summaryParts.push(`Jenis file: ${fileTypes.join(", ")}`);
      }

      const summary_notes = summaryParts.join(" | ");

      // Build structured file_inventory_notes
      let fileInventoryNotes = `Folder: ${folder.name}\n`;
      fileInventoryNotes += `Folder URL: ${folder.url || "-"}\n\n`;
      fileInventoryNotes += `Daftar file:\n`;
      folder.files.forEach((f, idx) => {
        fileInventoryNotes += `${idx + 1}. ${f.name}\n`;
        fileInventoryNotes += `   Type: ${f.mimeType || "File"}\n`;
        fileInventoryNotes += `   URL: ${f.url || "-"}\n\n`;
      });

      // Build structured file_inventory
      const file_inventory = folder.files.map((f) => ({
        name: f.name,
        url: f.url,
        type: "file" as const,
        mime_type: f.mimeType,
        level: f.level,
        parent_folder: f.parentFolder,
      }));

      const drive_links = folder.url ? [folder.url] : [];
      const guessedType = guessDesignType(folder.name, folder.files[0]?.mimeType || "");

      return {
        title: folder.name,
        scope: options.scope,
        event_id: options.event_id || "",
        event_name: options.event_name || "",
        year: options.year || new Date().getFullYear(),
        design_type: guessedType,
        drive_url: folder.url || folder.files[0]?.url || "",
        thumbnail_url: "",
        style_notes: options.styleNotesDefault || "",
        color_palette: [],
        notes: options.notesDefault || "",

        category: options.categoryDefault || "drive",
        drive_links,
        canva_links: [],
        doc_links: [],
        other_links: [],
        summary_notes,
        file_inventory_notes: fileInventoryNotes.trim(),
        file_inventory,
      };
    });
  }

  if (options.mode === "one_large_archive") {
    const urls = rows.map((r) => r.url).filter(Boolean);
    const { drive_links, canva_links, doc_links, other_links } = distributeLinks(urls);

    const level0Folder = rows.find((r) => r.level === 0 && r.type === "Folder");
    const title = level0Folder?.name || options.event_name || "Arsip Referensi Utama";

    let fileInventoryNotes = `Struktur Folder Lengkap:\n`;
    rows.forEach((r, idx) => {
      const indent = "  ".repeat(r.level || 0);
      fileInventoryNotes += `${idx + 1}. ${indent}[${r.type}] ${r.name}\n`;
      if (r.url) {
        fileInventoryNotes += `${indent}   Link: ${r.url}\n`;
      }
    });

    const file_inventory = rows.map((r) => ({
      name: r.name,
      url: r.url,
      type: r.type.trim().toLowerCase() === "folder" ? ("folder" as const) : ("file" as const),
      mime_type: r.mimeType,
      level: r.level,
      parent_folder: r.parentFolder,
    }));

    return [
      {
        title,
        scope: options.scope,
        event_id: options.event_id || "",
        event_name: options.event_name || "",
        year: options.year || new Date().getFullYear(),
        design_type: "lainnya",
        drive_url: drive_links[0] || "",
        thumbnail_url: "",
        style_notes: options.styleNotesDefault || "",
        color_palette: [],
        notes: options.notesDefault || "",

        category: options.categoryDefault || "drive",
        drive_links,
        canva_links,
        doc_links,
        other_links,
        summary_notes: `Arsip Besar Tunggal dari Drive Tree.`,
        file_inventory_notes: fileInventoryNotes.trim(),
        file_inventory,
      },
    ];
  }

  return [];
}
