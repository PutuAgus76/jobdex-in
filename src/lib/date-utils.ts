export function getDateFromValue(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  return null;
}

export function formatTime(value: unknown) {
  const date = getDateFromValue(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateSeparator(value: unknown) {
  const date = getDateFromValue(value);

  if (!date) {
    return "Tanpa tanggal";
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDate(date, today)) {
    return "Hari ini";
  }

  if (isSameDate(date, yesterday)) {
    return "Kemarin";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
