export function sanitizeFieldResponse(content: string) {
  let cleaned = content.trim();
  cleaned = cleaned.replace(/^```[\w-]*\s*/i, "").replace(/\s*```$/i, "").trim();

  const quotedMatch = cleaned.match(/["“”']([^"“”'\n]{1,180})["“”']/);
  if (quotedMatch?.[1]) {
    cleaned = quotedMatch[1].trim();
  }

  const singleLine = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (singleLine.length > 1) {
    cleaned = singleLine[0];
  } else if (singleLine.length === 1) {
    const colonMatch = singleLine[0].match(/^[^:]{1,80}:\s*(.+)$/);
    if (colonMatch) {
      cleaned = colonMatch[1].trim();
    } else {
      cleaned = singleLine[0];
    }
  }

  cleaned = cleaned
    .replace(/^[-*]\s*/, "")
    .replace(/^(valore|value|campo|risposta)\s*[:=-]\s*/i, "")
    .trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"'))
    || (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
}
