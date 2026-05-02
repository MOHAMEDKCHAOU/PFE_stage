const EMAIL_MAX = 254;
/** RFC 5322 simplifié : suffisant pour rejeter entrées triviales / injection */
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

export function normalizeStudioClientEmail(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t || t.length > EMAIL_MAX) return null;
  if (!EMAIL_RE.test(t)) return null;
  return t;
}
