import type { DexSlot } from "@/lib/types";

/** Match name, slug, national id, entry #, or `#025` / `25`. */
export function slotMatchesQuery(slot: DexSlot, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return false;

  const stripped = q.replace(/^#+/, "");
  if (/^\d+$/.test(stripped)) {
    const n = Number(stripped);
    return slot.id === n || slot.entryNumber === n;
  }

  return slot.name.toLowerCase().includes(q) || slot.slug.toLowerCase().includes(q);
}

export function filterSlotsByQuery(slots: DexSlot[], raw: string): DexSlot[] {
  const q = raw.trim();
  if (!q) return [];
  return slots.filter((s) => slotMatchesQuery(s, q));
}
