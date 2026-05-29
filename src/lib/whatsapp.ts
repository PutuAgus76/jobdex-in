export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/[^\d+]/g, "").replace(/^\+/, "");

  if (digits.startsWith("08")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8")) {
    return `62${digits}`;
  }

  return digits;
}

export function isValidWhatsAppNumber(value: string) {
  return /^628[1-9][0-9]{7,12}$/.test(value);
}
