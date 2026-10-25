import nationalDex from "@/data/national-dex.json";
import type { DexSlot, MysteryGift } from "@/lib/types";

/** UTC day boundary so SSR (Worker) and the browser agree on gift windows. */
function startOfDayUtc(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function parseGiftDay(isoDate: string) {
  // Date-only strings are UTC midnight; full ISO keeps its instant then floors to UTC day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return startOfDayUtc(new Date(`${isoDate}T00:00:00.000Z`));
  }
  return startOfDayUtc(new Date(isoDate));
}

const speciesByName = (() => {
  const map = new Map<string, DexSlot>();
  for (const box of nationalDex.boxes as Array<{ slots: DexSlot[] }>) {
    for (const slot of box.slots) {
      map.set(slot.name.toLowerCase(), slot);
    }
  }
  return map;
})();

const speciesById = (() => {
  const map = new Map<number, DexSlot>();
  for (const box of nationalDex.boxes as Array<{ slots: DexSlot[] }>) {
    for (const slot of box.slots) map.set(slot.id, slot);
  }
  return map;
})();

/** Resolve a gift to a national dex slot via id and/or name. */
export function resolveGiftPokemon(gift: { pokemon?: string; pokemonId?: number }): DexSlot | null {
  if (gift.pokemonId != null) {
    const byId = speciesById.get(gift.pokemonId);
    if (byId) return byId;
  }
  const name = gift.pokemon;
  if (!name) return null;
  const cleaned = name
    .replace(/[★☆✦✧*]/g, "")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .trim()
    .toLowerCase();
  if (!cleaned) return null;
  return speciesByName.get(cleaned) ?? speciesByName.get(cleaned.split(/\s+/)[0]!) ?? null;
}

export function giftSourceLabel(gift: MysteryGift): string | null {
  if (gift.sourceUrl?.includes("serebii")) return "Serebii";
  if (gift.sourceUrl?.includes("pokemon.com")) return "Pokémon";
  return null;
}

/** Drop auto-generated “via Serebii…” notes; keep real curator notes. */
export function giftDisplayNotes(gift: MysteryGift): string | null {
  if (!gift.notes) return null;
  if (/^via\s+serebii/i.test(gift.notes.trim())) return null;
  if (/·\s*via\s+serebii/i.test(gift.notes)) return null;
  return gift.notes;
}

export function giftWindow(gift: MysteryGift, now = new Date()) {
  const start = parseGiftDay(gift.start);
  const end = gift.end ? parseGiftDay(gift.end) : null;
  const today = startOfDayUtc(now);

  const isUpcoming = today < start;
  const isExpired = end != null && today > end;
  const isActive = !isUpcoming && !isExpired;

  const msLeft = end != null ? end - today : null;
  const daysLeft = msLeft == null ? null : Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const endingSoon = isActive && daysLeft != null && daysLeft <= 7;

  return { isUpcoming, isExpired, isActive, daysLeft, endingSoon };
}

export function categorizeGifts(gifts: MysteryGift[]) {
  const active: MysteryGift[] = [];
  const endingSoon: MysteryGift[] = [];
  const upcoming: MysteryGift[] = [];

  for (const gift of gifts) {
    const w = giftWindow(gift);
    if (w.isUpcoming) upcoming.push(gift);
    else if (w.endingSoon) endingSoon.push(gift);
    else if (w.isActive) active.push(gift);
  }

  return { active, endingSoon, upcoming };
}
