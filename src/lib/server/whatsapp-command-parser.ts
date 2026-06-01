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
  | "unknown";

export interface ParsedWhatsAppCommand {
  intent: WhatsAppCommandIntent;
  rawText: string;
  fields: Record<string, string>;
  items?: Array<Record<string, string>>;
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

  // 1. Check intent based on command starting words
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

    // Check for numbered lines like: 1. judul: ... | pic: ...
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
      // Parse general top-level properties like "tipe: divisi"
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
  
  // Extract task title search query after "approve task"
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
  
  // Format is: konfirmasi <code_id> pin: <pin_code>
  // e.g. konfirmasi ABC123 pin: 123456
  // let's use a regex to capture code and pin
  const match = cleaned.match(/^konfirmasi\s+([a-z0-9]{6})\s+pin:\s*(\d+)/i);
  if (match) {
    fields["code"] = match[1].trim().toUpperCase();
    fields["pin"] = match[2].trim();
  } else {
    // Try a looser match if there are spaces or different casing
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      fields["code"] = parts[1].trim().toUpperCase();
    }
    const pinMatch = cleaned.match(/pin:\s*(\d+)/i);
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
  
  // Format is: batal <code_id> pin: <pin_code>
  // e.g. batal ABC123 pin: 123456
  const match = cleaned.match(/^batal\s+([a-z0-9]{6})\s+pin:\s*(\d+)/i);
  if (match) {
    fields["code"] = match[1].trim().toUpperCase();
    fields["pin"] = match[2].trim();
  } else {
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      fields["code"] = parts[1].trim().toUpperCase();
    }
    const pinMatch = cleaned.match(/pin:\s*(\d+)/i);
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
