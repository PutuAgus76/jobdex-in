import "server-only";
import { generateText } from "./ai-provider";


export type WhatsAppCommandIntent =
  | "template_help"
  | "create_task_preview"
  | "create_event_preview"
  | "bulk_create_task_preview"
  // NOTE: "approve_task_preview" dihapus — dead code, sudah digantikan oleh "approve_task"
  | "progress_question"
  | "confirm_command"
  | "cancel_command"
  | "bantuan_task"
  | "deadline_query"
  | "approve_task"
  | "update_status"
  | "edit_task"
  | "confirm_edit"
  | "cancel_edit"
  | "archive_task"
  | "confirm_archive"
  | "checklist_task"
  | "create_reference_preview"
  | "cek_pengirim"
  | "cek_grup"
  | "event_grup"
  | "hubungkan_grup_acara"
  | "tugas_saya"
  | "detail_task"
  | "upload_hasil"
  | "minta_revisi"
  | "cek_checklist"
  | "tambah_catatan"
  | "ganti_pic"
  | "briefing"
  | "siapa_belum_update"
  | "cek_role"
  | "unknown";

export interface ParsedWhatsAppCommand {
  intent: WhatsAppCommandIntent;
  rawText: string;
  fields: Record<string, string>;
  items?: Array<Record<string, string>>;
}

export function isTaskCommandLike(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  let clean = normalized;
  if (clean.startsWith("!jobdex")) {
    clean = clean.replace(/^!jobdex/i, "").trim();
  }

  const taskPatterns = [
    "update status",
    "ubah status",
    "ganti status",
    "approve task",
    "approve jobdesk",
    "acc task",
    "acc jobdesk",
    "edit task",
    "edit jobdesk",
    "ubah deadline",
    "ganti pic",
    "archive task",
    "arsipkan task",
    "checklist",
    "jobdesk yang berjudul",
    "job desk yang berjudul",
    "task yang berjudul",
    "tugas yang berjudul",
    "tugas saya",
    "detail task",
    "detail jobdesk",
    "upload hasil",
    "kirim hasil",
    "minta revisi",
    "revisi task",
    "cek checklist",
    "tambah catatan",
    "briefing",
    "siapa belum update",
    "cek role saya",
    "hubungkan grup acara",
  ];

  return taskPatterns.some((pattern) => clean.includes(pattern));
}

/**
 * Clean message text for parsing by removing the !jobdex trigger if present
 */
function cleanMessage(text: string): string {
  const trimmed = text.trim();
  if (trimmed.toLowerCase().startsWith("!jobdex")) {
    return trimmed.replace(/^!jobdex/i, "").trim();
  }
  return trimmed;
}

export function parseWhatsAppCommand(rawText: string): ParsedWhatsAppCommand {
  const rawCleaned = cleanMessage(rawText);
  const pinMatch = rawCleaned.match(/(?:pin\s*:?\s*)(\d{4,6})/i);
  const pin = pinMatch ? pinMatch[1] : "";
  const cleaned = rawCleaned.replace(/(?:pin\s*:?\s*)(\d{4,6})/i, "").trim();
  const lowerCleaned = cleaned.toLowerCase();

  const result = parseWhatsAppCommandInternal(rawText, cleaned, lowerCleaned);
  if (result.fields && pin && !result.fields.pin) {
    result.fields.pin = pin;
  }
  return result;
}

function parseWhatsAppCommandInternal(
  rawText: string,
  cleaned: string,
  lowerCleaned: string
): ParsedWhatsAppCommand {
  // --- New 19B/20C Task & Event Commands ---

  // 0. hubungkan grup acara
  if (lowerCleaned.startsWith("hubungkan grup acara ")) {
    const eventName = cleaned.substring("hubungkan grup acara ".length).trim();
    return {
      intent: "hubungkan_grup_acara",
      rawText,
      fields: { event_name: eventName },
    };
  }

  // 1. tugas saya
  if (lowerCleaned === "tugas saya" || lowerCleaned.startsWith("tugas saya ")) {
    let variation = "all";
    if (lowerCleaned.includes("minggu ini")) {
      variation = "minggu_ini";
    } else if (lowerCleaned.includes("belum selesai")) {
      variation = "belum_selesai";
    } else if (lowerCleaned.includes("deadline dekat")) {
      variation = "deadline_dekat";
    }
    return {
      intent: "tugas_saya",
      rawText,
      fields: { variation },
    };
  }

  // 2. detail task / jobdesk
  if (lowerCleaned.startsWith("detail task ") || lowerCleaned.startsWith("detail jobdesk ")) {
    const taskNameRaw = cleaned.replace(/^(detail task|detail jobdesk)\s+/i, "").trim();
    const isCode = taskNameRaw.toLowerCase().startsWith("kode ");
    const cleanTaskName = isCode ? taskNameRaw.replace(/^kode\s+/i, "").trim() : taskNameRaw;
    return {
      intent: "detail_task",
      rawText,
      fields: {
        task_name: cleanTaskName,
        is_code: isCode ? "true" : "false",
      },
    };
  }

  // 3. upload hasil / kirim hasil
  if (lowerCleaned.startsWith("upload hasil ") || lowerCleaned.startsWith("kirim hasil ") ||
      lowerCleaned.startsWith("upload hasil\n") || lowerCleaned.startsWith("kirim hasil\n")) {
    const lines = cleaned.split("\n");
    const firstLine = lines[0].trim();
    const taskNameRaw = firstLine.replace(/^(upload hasil|kirim hasil)\s+/i, "").trim();
    const isCode = taskNameRaw.toLowerCase().startsWith("kode ");
    const cleanTaskName = isCode ? taskNameRaw.replace(/^kode\s+/i, "").trim() : taskNameRaw;

    let link = "";
    let catatan = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith("link:")) {
        link = line.slice(5).trim();
      } else if (line.toLowerCase().startsWith("catatan:")) {
        catatan = line.slice(8).trim();
      }
    }
    return {
      intent: "upload_hasil",
      rawText,
      fields: {
        task_name: cleanTaskName,
        is_code: isCode ? "true" : "false",
        link,
        catatan,
      },
    };
  }

  // 4. minta revisi / revisi task
  if (lowerCleaned.startsWith("minta revisi ") || lowerCleaned.startsWith("revisi task ") ||
      lowerCleaned.startsWith("minta revisi\n") || lowerCleaned.startsWith("revisi task\n")) {
    const lines = cleaned.split("\n");
    const firstLine = lines[0].trim();
    const taskNameRaw = firstLine.replace(/^(minta revisi|revisi task)\s+/i, "").trim();
    const isCode = taskNameRaw.toLowerCase().startsWith("kode ");
    const cleanTaskName = isCode ? taskNameRaw.replace(/^kode\s+/i, "").trim() : taskNameRaw;

    let catatan = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith("catatan:")) {
        catatan = line.slice(8).trim();
      }
    }
    if (!catatan && firstLine.toLowerCase().includes("catatan:")) {
      const idx = firstLine.toLowerCase().indexOf("catatan:");
      catatan = firstLine.slice(idx + 8).trim();
    }
    return {
      intent: "minta_revisi",
      rawText,
      fields: {
        task_name: cleanTaskName,
        is_code: isCode ? "true" : "false",
        catatan,
      },
    };
  }

  // 5. cek checklist
  if (lowerCleaned.startsWith("cek checklist ") || (lowerCleaned.startsWith("checklist ") && !lowerCleaned.includes("selesai"))) {
    const taskNameRaw = cleaned.replace(/^(cek checklist|checklist)\s+/i, "").trim();
    const isCode = taskNameRaw.toLowerCase().startsWith("kode ");
    const cleanTaskName = isCode ? taskNameRaw.replace(/^kode\s+/i, "").trim() : taskNameRaw;
    return {
      intent: "cek_checklist",
      rawText,
      fields: {
        task_name: cleanTaskName,
        is_code: isCode ? "true" : "false",
      },
    };
  }

  // 6. tambah catatan
  if (lowerCleaned.startsWith("tambah catatan ") || lowerCleaned.startsWith("tambah catatan\n")) {
    const lines = cleaned.split("\n");
    const firstLine = lines[0].trim();
    const taskNameRaw = firstLine.replace(/^tambah catatan\s+/i, "").trim();
    const isCode = taskNameRaw.toLowerCase().startsWith("kode ");
    const cleanTaskName = isCode ? taskNameRaw.replace(/^kode\s+/i, "").trim() : taskNameRaw;

    let catatan = "";
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().startsWith("catatan:")) {
        catatan = line.slice(8).trim();
      }
    }
    if (!catatan && firstLine.toLowerCase().includes("catatan:")) {
      const idx = firstLine.toLowerCase().indexOf("catatan:");
      catatan = firstLine.slice(idx + 8).trim();
    }
    return {
      intent: "tambah_catatan",
      rawText,
      fields: {
        task_name: cleanTaskName,
        is_code: isCode ? "true" : "false",
        catatan,
      },
    };
  }

  // 7. ganti pic / assign task
  if (lowerCleaned.startsWith("ganti pic ") || lowerCleaned.startsWith("assign task ")) {
    const cleanText = cleaned.replace(/^(ganti pic|assign task)\s+/i, "").trim();
    const isCode = cleanText.toLowerCase().startsWith("kode ");
    const cleanTextNoKode = isCode ? cleanText.replace(/^kode\s+/i, "").trim() : cleanText;

    const keMatch = cleanTextNoKode.match(/\s+ke\s+/i);
    if (keMatch && keMatch.index !== undefined) {
      const taskName = cleanTextNoKode.slice(0, keMatch.index).trim();
      const picName = cleanTextNoKode.slice(keMatch.index + keMatch[0].length).trim();
      return {
        intent: "ganti_pic",
        rawText,
        fields: {
          task_name: taskName,
          is_code: isCode ? "true" : "false",
          pic_name: picName,
        },
      };
    }
  }

  // 1. bantuan task
  if (lowerCleaned === "bantuan task" || lowerCleaned === "bantuan" || lowerCleaned === "help") {
    return {
      intent: "bantuan_task",
      rawText,
      fields: {},
    };
  }

  // 1.b cek pengirim
  if (lowerCleaned === "cek pengirim") {
    return {
      intent: "cek_pengirim",
      rawText,
      fields: {},
    };
  }

  if (lowerCleaned === "cek role saya" || lowerCleaned === "cek role") {
    return {
      intent: "cek_role",
      rawText,
      fields: {},
    };
  }

  if (lowerCleaned === "briefing") {
    return {
      intent: "briefing",
      rawText,
      fields: {},
    };
  }

  if (lowerCleaned === "siapa belum update") {
    return {
      intent: "siapa_belum_update",
      rawText,
      fields: {},
    };
  }

  // 1.c cek grup
  if (lowerCleaned === "cek grup") {
    return {
      intent: "cek_grup",
      rawText,
      fields: {},
    };
  }

  // 1.d event grup
  if (lowerCleaned === "event grup" || lowerCleaned === "acara grup") {
    return {
      intent: "event_grup",
      rawText,
      fields: {},
    };
  }

  // 1.e hubungkan grup acara
  if (lowerCleaned.startsWith("hubungkan grup acara ")) {
    const eventName = cleaned.replace(/^hubungkan\s+grup\s+acara\s+/i, "").trim();
    return {
      intent: "hubungkan_grup_acara",
      rawText,
      fields: { event_name: eventName },
    };
  }

  // 2. Read-only Deadline & Risk Queries
  const deadlineQueries = [
    { cmd: "deadline dekat", type: "dekat" },
    { cmd: "tugas h-7", type: "h-7" },
    { cmd: "tugas h-5", type: "h-5" },
    { cmd: "tugas h-3", type: "h-3" },
    { cmd: "tugas h-1", type: "h-1" },
    { cmd: "tugas hari ini", type: "hari_ini" },
    { cmd: "tugas overdue", type: "overdue" },
    { cmd: "siapa yang belum mulai", type: "belum_dimulai" },
    { cmd: "siapa yang stuck", type: "stuck" },
    { cmd: "siapa yang butuh bantuan", type: "butuh_bantuan" },
    { cmd: "siapa yang menunggu materi", type: "menunggu_materi" },
    { cmd: "siapa yang menunggu approval", type: "menunggu_approval" },
    { cmd: "tugas berisiko", type: "berisiko" },
    { cmd: "tugas kritis", type: "kritis" },
    { cmd: "tugas prioritas tinggi", type: "prioritas_tinggi" },
  ];

  for (const q of deadlineQueries) {
    if (lowerCleaned === q.cmd) {
      return {
        intent: "deadline_query",
        rawText,
        fields: { query_type: q.type },
      };
    }
  }

  // 3. Confirm Edit / Cancel Edit
  if (lowerCleaned.startsWith("konfirmasi edit")) {
    const match = cleaned.match(/^konfirmasi\s+edit\s+([a-z0-9]{6})(?:\s+pin\s*:?\s*(\d+))?/i);
    if (match) {
      return {
        intent: "confirm_edit",
        rawText,
        fields: { code: match[1].toUpperCase(), pin: match[2] || "" },
      };
    }
  } else if (lowerCleaned.startsWith("batal edit")) {
    const match = cleaned.match(/^batal\s+edit\s+([a-z0-9]{6})(?:\s+pin\s*:?\s*(\d+))?/i);
    if (match) {
      return {
        intent: "cancel_edit",
        rawText,
        fields: { code: match[1].toUpperCase(), pin: match[2] || "" },
      };
    }
  }

  // 4. Confirm Archive
  if (lowerCleaned.startsWith("konfirmasi archive")) {
    const match = cleaned.match(/^konfirmasi\s+archive\s+([a-z0-9]{6})(?:\s+pin\s*:?\s*(\d+))?/i);
    if (match) {
      return {
        intent: "confirm_archive",
        rawText,
        fields: { code: match[1].toUpperCase(), pin: match[2] || "" },
      };
    }
  }

  // 5. Checklist Task
  if (lowerCleaned.startsWith("checklist")) {
    const match = cleaned.match(/^checklist\s+(kode\s+)?(.+?)\s+(\w+)\s+selesai(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "checklist_task",
        rawText,
        fields: {
          is_code: match[1] ? "true" : "false",
          task_name: match[2].trim(),
          item: match[3].toLowerCase().trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  // 6. Update Status Command (Custom, Natural & Colon-less PIN parsing)
  if (
    lowerCleaned.includes("update status") ||
    lowerCleaned.includes("ubah status") ||
    lowerCleaned.includes("ganti status")
  ) {
    const pinMatch = cleaned.match(/(?:pin\s*:?\s*)(\d{4,6})/i);
    const pin = pinMatch ? pinMatch[1] : "";
    const textWithoutPin = cleaned.replace(/(?:pin\s*:?\s*)(\d{4,6})/i, "").trim();

    let targetStatusText = "";
    let notes = "";
    const statusMatch = textWithoutPin.match(/(?:menjadi|ke)\s+([^]+?)(?:\s+catatan:\s*([^]+))?$/i);
    if (statusMatch) {
      targetStatusText = statusMatch[1].trim();
      notes = statusMatch[2] ? statusMatch[2].trim() : "";
    }

    let taskTitle = "";
    let isCode = "false";
    const quoteMatch = textWithoutPin.match(/(?:yang\s+berjudul|berjudul|jobdesk|task|tugas|kode)\s+["']([^"']+)["']/i);
    if (quoteMatch) {
      taskTitle = quoteMatch[1].trim();
      if (textWithoutPin.match(/(?:kode)\s+["']([^"']+)["']/i)) {
        isCode = "true";
      }
    } else {
      const anyQuoteMatch = textWithoutPin.match(/["']([^"']+)["']/);
      if (anyQuoteMatch) {
        taskTitle = anyQuoteMatch[1].trim();
        if (textWithoutPin.toLowerCase().includes("kode")) {
          isCode = "true";
        }
      } else {
        const traditionalMatch = textWithoutPin.match(/^(?:update|ubah|ganti)\s+status\s+(?:dari\s+)?(?:jobdesk|task|tugas)?\s*(?:yang\s+berjudul\s+)?(?:kode\s+)?([^]+?)\s+(?:menjadi|ke)\s+/i);
        if (traditionalMatch) {
          taskTitle = traditionalMatch[1].trim();
          const prefixPart = textWithoutPin.slice(0, textWithoutPin.indexOf(taskTitle));
          if (prefixPart.toLowerCase().includes("kode")) {
            isCode = "true";
          }
        } else {
          const fallbackMatch = textWithoutPin.match(/^(?:update|ubah|ganti)\s+status\s+(?:dari\s+)?(?:jobdesk|task|tugas)?\s*(?:yang\s+berjudul\s+)?(?:kode\s+)?([^]+)$/i);
          if (fallbackMatch) {
            taskTitle = fallbackMatch[1].trim();
            const prefixPart = textWithoutPin.slice(0, textWithoutPin.indexOf(taskTitle));
            if (prefixPart.toLowerCase().includes("kode")) {
              isCode = "true";
            }
          }
        }
      }
    }

    return {
      intent: "update_status",
      rawText,
      fields: {
        is_code: isCode,
        task_name: taskTitle,
        status: targetStatusText,
        notes: notes,
        pin: pin,
      },
    };
  }

  // 7. Short Edit Commands (Colon-less PIN support)
  if (lowerCleaned.startsWith("ubah deadline")) {
    const match = cleaned.match(/^ubah\s+deadline\s+(task|kode)\s+(.+?)\s+ke\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "edit_task",
        rawText,
        fields: {
          is_code: match[1].toLowerCase() === "kode" ? "true" : "false",
          task_name: match[2].trim(),
          deadline: match[3].trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  if (lowerCleaned.startsWith("ganti pic")) {
    const match = cleaned.match(/^ganti\s+pic\s+(task|kode)\s+(.+?)\s+ke\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "edit_task",
        rawText,
        fields: {
          is_code: match[1].toLowerCase() === "kode" ? "true" : "false",
          task_name: match[2].trim(),
          pic: match[3].trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  if (lowerCleaned.startsWith("ubah prioritas")) {
    const match = cleaned.match(/^ubah\s+prioritas\s+(task|kode)\s+(.+?)\s+ke\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "edit_task",
        rawText,
        fields: {
          is_code: match[1].toLowerCase() === "kode" ? "true" : "false",
          task_name: match[2].trim(),
          prioritas: match[3].trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  if (lowerCleaned.startsWith("edit warna")) {
    const match = cleaned.match(/^edit\s+warna\s+(task|kode)\s+(.+?)\s+jadi\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "edit_task",
        rawText,
        fields: {
          is_code: match[1].toLowerCase() === "kode" ? "true" : "false",
          task_name: match[2].trim(),
          warna: match[3].trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  if (lowerCleaned.startsWith("edit referensi")) {
    const match = cleaned.match(/^edit\s+referensi\s+(task|kode)\s+(.+?)\s+jadi\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      return {
        intent: "edit_task",
        rawText,
        fields: {
          is_code: match[1].toLowerCase() === "kode" ? "true" : "false",
          task_name: match[2].trim(),
          referensi: match[3].trim(),
          pin: match[4] ? match[4].trim() : "",
        },
      };
    }
  }

  // 8. Archive Task Command (Colon-less PIN support)
  if (
    lowerCleaned.startsWith("archive task") ||
    lowerCleaned.startsWith("arsipkan task") ||
    lowerCleaned.startsWith("arsipkan jobdesk") ||
    lowerCleaned.startsWith("archive kode")
  ) {
    const match = cleaned.match(/^(?:archive\s+task|arsipkan\s+task|arsipkan\s+jobdesk|archive\s+kode)\s+(.+?)(?:\s+pin\s*:?\s*(\d+))?\s*$/i);
    if (match) {
      const isCode = lowerCleaned.startsWith("archive kode");
      return {
        intent: "archive_task",
        rawText,
        fields: {
          is_code: isCode ? "true" : "false",
          task_name: match[1].trim(),
          pin: match[2] ? match[2].trim() : "",
        },
      };
    }
  }

  // 9. Full Block Edit Task (Colon-less PIN support)
  if (lowerCleaned.startsWith("edit task") || lowerCleaned.startsWith("edit kode")) {
    const lines = cleaned.split("\n");
    const fields: Record<string, string> = {};
    const isCode = lowerCleaned.startsWith("edit kode");
    let taskName = "";

    const firstLineMatch = lines[0].match(/^(?:edit\s+task|edit\s+kode)\s+(.+)$/i);
    if (firstLineMatch) {
      taskName = firstLineMatch[1].trim();
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const colonIndex = line.indexOf(":");
      if (colonIndex !== -1) {
        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const val = line.slice(colonIndex + 1).trim();
        if (key && val) {
          fields[key] = val;
        }
      }
    }

    let pin = fields.pin || "";
    if (!pin) {
      const pinMatch = cleaned.match(/(?:pin\s*:?\s*)(\d{4,6})/i);
      if (pinMatch) pin = pinMatch[1];
    }

    return {
      intent: "edit_task",
      rawText,
      fields: {
        ...fields,
        is_code: isCode ? "true" : "false",
        task_name: taskName,
        pin: pin,
      },
    };
  }

  // 10. Approve Task (Colon-less PIN support)
  if (
    lowerCleaned.startsWith("approve task") ||
    lowerCleaned.startsWith("approve jobdesk") ||
    lowerCleaned.startsWith("approve kode") ||
    lowerCleaned.startsWith("acc task") ||
    lowerCleaned.startsWith("acc jobdesk")
  ) {
    const pinMatch = cleaned.match(/(?:pin\s*:?\s*)(\d{4,6})/i);
    const pin = pinMatch ? pinMatch[1].trim() : "";
    const prefixMatch = cleaned.match(/^(?:approve\s+task|approve\s+jobdesk|approve\s+kode|acc\s+task|acc\s+jobdesk)\s+(.+?)(?:\s+pin\s*:?\s*\d+)?\s*$/i);
    if (prefixMatch) {
      const isCode = lowerCleaned.startsWith("approve kode");
      return {
        intent: "approve_task",
        rawText,
        fields: {
          is_code: isCode ? "true" : "false",
          task_name: prefixMatch[1].trim(),
          pin,
        },
      };
    }
  }

  // Fallback to original parsing methods
  const isAddReference =
    lowerCleaned.startsWith("tambah referensi") ||
    lowerCleaned.startsWith("tambahkan referensi") ||
    lowerCleaned.startsWith("tambah arsip referensi") ||
    lowerCleaned.startsWith("tambah referensi desain") ||
    lowerCleaned.startsWith("tambahkan referensi ini");

  if (isAddReference) {
    return parseReferenceCommand(rawText, cleaned);
  }

  if (lowerCleaned.startsWith("konfirmasi")) {
    return parseConfirmCommand(rawText, cleaned);
  } else if (lowerCleaned.startsWith("batal")) {
    return parseCancelCommand(rawText, cleaned);
  } else if (lowerCleaned.startsWith("tambah banyak jobdesk")) {
    return parseBulkTaskCommand(rawText, cleaned);
  } else if (lowerCleaned.startsWith("tambah jobdesk")) {
    return parseSingleTaskCommand(rawText, cleaned);
  } else if (lowerCleaned.startsWith("tambah acara")) {
    return parseEventCommand(rawText, cleaned);
  } else if (lowerCleaned.startsWith("approve task")) {
    // NOTE: "approve task" sudah ditangani lebih awal di parseWhatsAppCommandInternal
    // (section 10, line ~656). Cabang ini tidak akan pernah tercapai.
    // Tetap dipertahankan sebagai safety fallback dengan intent "approve_task".
    const prefixMatch = cleaned.match(/^approve\s+task\s+(.+)$/i);
    if (prefixMatch) {
      return { intent: "approve_task", rawText, fields: { task_name: prefixMatch[1].trim(), is_code: "false", pin: "" } };
    }
  } else if (lowerCleaned.startsWith("format") || lowerCleaned.startsWith("contoh")) {
    return {
      intent: "template_help",
      rawText,
      fields: {},
    };
  } else if (
    lowerCleaned.startsWith("siapa yang stuck") ||
    lowerCleaned.startsWith("ringkas progress") ||
    lowerCleaned.startsWith("deadline terdekat") ||
    lowerCleaned.startsWith("siapa yang belum mulai") ||
    lowerCleaned.includes("stuck") ||
    lowerCleaned.includes("progress") ||
    lowerCleaned.includes("deadline")
  ) {
    return {
      intent: "progress_question",
      rawText,
      fields: {},
    };
  }

  return {
    intent: "unknown",
    rawText,
    fields: {},
  };
}

function parseSingleTaskCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const lines = cleaned.split("\n");
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().startsWith("tambah jobdesk")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
      const val = trimmed.slice(colonIndex + 1).trim();
      if (key && val) {
        fields[key] = val;
      }
    }
  }

  return {
    intent: "create_task_preview",
    rawText,
    fields,
  };
}

function parseEventCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const lines = cleaned.split("\n");
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().startsWith("tambah acara")) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
      const val = trimmed.slice(colonIndex + 1).trim();
      if (key && val) {
        fields[key] = val;
      }
    }
  }

  return {
    intent: "create_event_preview",
    rawText,
    fields,
  };
}

function parseBulkTaskCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const lines = cleaned.split("\n");
  const fields: Record<string, string> = {};
  const items: Array<Record<string, string>> = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toLowerCase().startsWith("tambah banyak jobdesk")) continue;

    const numMatch = trimmed.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
      const itemContent = numMatch[2].trim();
      const itemFields: Record<string, string> = {};
      const parts = itemContent.split("|");
      
      for (const part of parts) {
        const colonIndex = part.indexOf(":");
        if (colonIndex !== -1) {
          const key = part.slice(0, colonIndex).trim().toLowerCase();
          const val = part.slice(colonIndex + 1).trim();
          if (key && val) {
            itemFields[key] = val;
          }
        }
      }
      
      if (Object.keys(itemFields).length > 0) {
        items.push(itemFields);
      }
    } else {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        const key = colonIndex !== -1 ? trimmed.slice(0, colonIndex).trim().toLowerCase() : "";
        const val = colonIndex !== -1 ? trimmed.slice(colonIndex + 1).trim() : "";
        if (key && val) {
          fields[key] = val;
        }
      }
    }
  }

  return {
    intent: "bulk_create_task_preview",
    rawText,
    fields,
    items,
  };
}

// NOTE: parseApproveTaskCommand dihapus (dead code).
// Intent "approve_task_preview" tidak lagi digunakan.
// Handler approve task sudah diproses sebelumnya di section 10 dengan intent "approve_task".

function parseConfirmCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const fields: Record<string, string> = {};
  const match = cleaned.match(/^konfirmasi\s+(?:referensi\s+)?([a-z0-9]{6})(?:\s+pin\s*:?\s*(\d+))?/i);
  if (match) {
    fields["code"] = match[1].trim().toUpperCase();
    fields["pin"] = match[2] ? match[2].trim() : "";
    if (cleaned.toLowerCase().includes("referensi")) {
      fields["type"] = "reference";
    }
  } else {
    const parts = cleaned.split(/\s+/);
    let codeIndex = 1;
    if (parts[1]?.toLowerCase() === "referensi") {
      codeIndex = 2;
      fields["type"] = "reference";
    }
    if (parts[codeIndex]) {
      fields["code"] = parts[codeIndex].trim().toUpperCase();
    }
    const pinMatch = cleaned.match(/pin\s*:?\s*(\d+)/i);
    if (pinMatch) {
      fields["pin"] = pinMatch[1].trim();
    }
  }

  return {
    intent: "confirm_command",
    rawText,
    fields,
  };
}

function parseCancelCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const fields: Record<string, string> = {};
  const match = cleaned.match(/^batal\s+(?:referensi\s+)?([a-z0-9]{6})(?:\s+pin\s*:?\s*(\d+))?/i);
  if (match) {
    fields["code"] = match[1].trim().toUpperCase();
    fields["pin"] = match[2] ? match[2].trim() : "";
    if (cleaned.toLowerCase().includes("referensi")) {
      fields["type"] = "reference";
    }
  } else {
    const parts = cleaned.split(/\s+/);
    let codeIndex = 1;
    if (parts[1]?.toLowerCase() === "referensi") {
      codeIndex = 2;
      fields["type"] = "reference";
    }
    if (parts[codeIndex]) {
      fields["code"] = parts[codeIndex].trim().toUpperCase();
    }
    const pinMatch = cleaned.match(/pin\s*:?\s*(\d+)/i);
    if (pinMatch) {
      fields["pin"] = pinMatch[1].trim();
    }
  }

  return {
    intent: "cancel_command",
    rawText,
    fields,
  };
}

function parseReferenceCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const lines = cleaned.split("\n");
  const fields: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const lowerTrimmed = trimmed.toLowerCase();
    if (
      lowerTrimmed.startsWith("tambah referensi") ||
      lowerTrimmed.startsWith("tambahkan referensi") ||
      lowerTrimmed.startsWith("tambah arsip referensi") ||
      lowerTrimmed.startsWith("tambah referensi desain") ||
      lowerTrimmed.startsWith("tambahkan referensi ini")
    ) {
      continue;
    }

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex !== -1) {
      const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
      const val = trimmed.slice(colonIndex + 1).trim();
      if (key && val) {
        fields[key] = val;
      }
    }
  }

  return {
    intent: "create_reference_preview",
    rawText,
    fields,
  };
}

export async function parseWhatsAppCommandNatural(rawText: string): Promise<ParsedWhatsAppCommand> {
  const clean = rawText.trim();
  if (!clean.toLowerCase().startsWith("!jobdex")) {
    return { intent: "unknown", rawText, fields: {} };
  }

  const systemPrompt = `You are a WhatsApp natural command parser for JobDex.in, a task management system.
Analyze the user's natural language command and parse it into a structured JSON block.

Supported Intents:
1. create_task_preview: Create a new single task/jobdesk.
   Keywords: "tambah jobdesk", "buat tugas", "tugaskan", "tambah task"
   Required fields in "fields":
   - judul: task title (e.g., "desain pamflet opening")
   - pic: PIC name, alias, nickname, or phone number (e.g., "Agus", "08123456789")
   - deadline: deadline date or date string (e.g., "20 Juni", "besok", "Jumat")
   - prioritas: inferred priority ("rendah", "sedang", "tinggi", "kritis"). Default is "sedang". If words like "urgent", "segera", "penting", "hari ini", "kritis" are used, prioritize "tinggi" or "kritis".
   - deskripsi: task description (optional, default to "-")
   - acara: event name (optional, if mentioned, e.g., "RAKER")
2. bulk_create_task_preview: Create multiple tasks in bulk.
   Keywords: "tambah banyak jobdesk", "buat banyak jobdesk", "buat jobdesk RAKER:" followed by a list.
   Required fields in "fields":
   - tipe: "divisi" or "acara". Default is "divisi" (unless event is mentioned).
   - acara: event name (if applicable).
   Required items in "items": list of tasks, each task is an object with fields: "judul", "pic", "deadline", "prioritas" (optional), "deskripsi" (optional).
3. update_status: Update status of a task.
   Keywords: "[task] sudah mulai...", "[task] stuck...", "[task] nunggu...", "[task] sudah upload..."
   Required fields in "fields":
   - task_name: task title or task code.
   - status: map to one of: "sedang_dikerjakan" (mulai, gas, on progress, proses), "stuck" (stuck, macet, terkendala), "menunggu_materi" (nunggu materi, bahan), "draft_selesai" (draft jadi/selesai), "menunggu_approval" (sudah upload/kirim link), "revisi_dikerjakan" (revisi selesai), "ditunda" (ditunda, pending).
   - notes: explanation/notes (required if status is "stuck", "butuh_bantuan", or "menunggu_materi").
4. minta_revisi: Request a revision.
   Keywords: "revisi [task]...", "[task] revisi ya...", "minta revisi [task]..."
   Required fields in "fields":
   - task_name: task title or code.
   - catatan: revision notes (e.g., "logo terlalu kecil").
5. approve_task: Approve/ACC a task.
   Keywords: "acc [task]", "approve [task]", "[task] oke/aman"
   Required fields in "fields":
   - task_name: task title or code.
6. reference_search: Search design references.
   Keywords: "cari referensi...", "cari poster..."
   Required fields in "fields":
   - keyword: search keyword.

If the message does not match any of these intents, return:
{
  "intent": "unknown",
  "fields": {}
}

Return ONLY a valid JSON object in this format (no markdown formatting, no code block backticks):
{
  "intent": "<intent_name>",
  "fields": { ... },
  "items": [ ... ] (only for bulk_create_task_preview)
}`;

  try {
    const response = await generateText({
      prompt: `Command: "${clean}"`,
      systemPrompt,
      feature: "natural_command_parsing",
      useCache: false,
      temperature: 0.1,
    });

    const text = response.text.trim();
    let parsedJson;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      const match = text.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/) || text.match(/\`\`\`\s*([\s\S]*?)\s*\`\`\`/);
      if (match?.[1]) {
        parsedJson = JSON.parse(match[1].trim());
      } else {
        throw new Error("Invalid JSON format");
      }
    }

    return {
      intent: parsedJson.intent || "unknown",
      rawText,
      fields: parsedJson.fields || {},
      items: parsedJson.items || undefined,
    };
  } catch (err) {
    console.error("[Natural Command Parser] Failed:", err);
    return { intent: "unknown", rawText, fields: {} };
  }
}
