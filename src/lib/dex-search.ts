import type { DexSlot } from '@/lib/types';

/** Needle chars appear in order in haystack (e.g. `pka` → Pikachu). */
function fuzzyIncludes(haystack: string, needle: string): boolean {
  let hi = 0;
  for (let ni = 0; ni < needle.length; ni++) {
    const found = haystack.indexOf(needle[ni]!, hi);
    if (found < 0) return false;
    hi = found + 1;
  }
  return true;
}

/** Higher is better; `-1` = no match. */
function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return -1;
  if (haystack === needle) return 1000;
  if (haystack.startsWith(needle)) return 900 - Math.min(haystack.length - needle.length, 80);
  const idx = haystack.indexOf(needle);
  if (idx >= 0) return 700 - Math.min(idx, 80);
  if (fuzzyIncludes(haystack, needle)) {
    return 400 - Math.min(haystack.length - needle.length, 200);
  }
  return -1;
}

function slotSearchScore(slot: DexSlot, raw: string): number {
  const q = raw.trim().toLowerCase();
  if (!q) return -1;

  const stripped = q.replace(/^#+/, '');
  if (/^\d+$/.test(stripped)) {
    const n = Number(stripped);
    if (slot.id === n || slot.entryNumber === n) return 1000;
    const idStr = String(slot.id);
    const entryStr = slot.entryNumber != null ? String(slot.entryNumber) : '';
    if (idStr.startsWith(stripped) || (entryStr && entryStr.startsWith(stripped))) return 800;
    return -1;
  }

  return Math.max(fuzzyScore(slot.name.toLowerCase(), q), fuzzyScore(slot.slug.toLowerCase(), q));
}

/** Match name, slug, national id, entry #, or `#025` / `25` (fuzzy on names). */
export function slotMatchesQuery(slot: DexSlot, raw: string): boolean {
  return slotSearchScore(slot, raw) >= 0;
}

export function filterSlotsByQuery(slots: DexSlot[], raw: string): DexSlot[] {
  const q = raw.trim();
  if (!q) return [];
  return slots
    .map((slot) => ({ slot, score: slotSearchScore(slot, q) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score || a.slot.id - b.slot.id || a.slot.name.localeCompare(b.slot.name))
    .map((row) => row.slot);
}
