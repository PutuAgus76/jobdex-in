import "server-only";

export type WhatsAppCommandIntent =
  | "template_help"
  | "create_task_preview"
  | "create_event_preview"
  | "bulk_create_task_preview"
  | "approve_task_preview"
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
  const cleaned = cleanMessage(rawText);
  const lowerCleaned = cleaned.toLowerCase();

  // 1. bantuan task
  if (lowerCleaned === "bantuan task" || lowerCleaned === "bantuan") {
    return {
      intent: "bantuan_task",
      rawText,
      fields: {},
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
    return parseApproveTaskCommand(rawText, cleaned);
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

function parseApproveTaskCommand(rawText: string, cleaned: string): ParsedWhatsAppCommand {
  const fields: Record<string, string> = {};
  const match = cleaned.match(/^approve\s+task\s+(.+)$/i);
  if (match) {
    fields["query"] = match[1].trim();
  }

  return {
    intent: "approve_task_preview",
    rawText,
    fields,
  };
}

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
