import nationalDex from "@/data/national-dex.json";
import type { DexSlot, MysteryGift } from "@/lib/types";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
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
export function resolveGiftPokemon(gift: {
  pokemon?: string;
  pokemonId?: number;
}): DexSlot | null {
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
  return (
    speciesByName.get(cleaned) ??
    speciesByName.get(cleaned.split(/\s+/)[0]!) ??
    null
  );
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
  const start = startOfDay(new Date(gift.start));
  const end = gift.end ? startOfDay(new Date(gift.end)) : null;
  const today = startOfDay(now);

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
