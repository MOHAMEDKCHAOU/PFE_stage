/** Profession domain / métier — texte libre, UX évolutive (reco IA, filtres). */
export const MAX_PROFESSION_LENGTH = 120;
export const MAX_IDENTITY_TAGS = 20;
export const MAX_TAG_LENGTH = 48;

export function normalizeProfession(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim().slice(0, MAX_PROFESSION_LENGTH);
  return t.length ? t : null;
}

/** Tableau JSON ou chaîne « tag1, tag2 » → liste dédoublonnée. `undefined` = champ absent du corps requête. */
export function normalizeTagsInput(raw: unknown): string[] | undefined {
  if (raw === undefined) return undefined;
  let list: string[] = [];
  if (Array.isArray(raw)) {
    list = raw.filter((t): t is string => typeof t === "string").map((t) => t.trim());
  } else if (typeof raw === "string") {
    list = raw.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
  } else {
    return undefined;
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list) {
    const key = t.slice(0, MAX_TAG_LENGTH).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, MAX_TAG_LENGTH));
    if (out.length >= MAX_IDENTITY_TAGS) break;
  }
  return out;
}

export function parseTagsFromJson(value: unknown): string[] {
  if (!value || !Array.isArray(value)) return [];
  return value.filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean);
}
