import type { TipBerry } from "@/data/trainer-tips";

/**
 * Official Mega Dimension Hyper Berry set (Game8 / in-game order).
 * Slugs match local Hyper sprites under `/berries/hyper/{id}.webp`.
 */
export const HYPER_BERRY_IDS = [
  "cheri",
  "chesto",
  "pecha",
  "rawst",
  "aspear",
  "oran",
  "persim",
  "lum",
  "sitrus",
  "pomeg",
  "kelpsy",
  "qualot",
  "hondew",
  "grepa",
  "tamato",
  "occa",
  "passho",
  "wacan",
  "rindo",
  "yache",
  "chople",
  "kebia",
  "shuca",
  "coba",
  "payapa",
  "tanga",
  "charti",
  "kasib",
  "haban",
  "colbur",
  "babiri",
  "chilan",
  "roseli",
] as const;

export type HyperBerryId = (typeof HYPER_BERRY_IDS)[number];

const REGULAR_BERRY_SPRITE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

/** ZA Hyper Berry bag art (vendored from Serebii itemdex into `public/berries/hyper`). */
export function hyperBerrySpriteUrl(id: string): string {
  return `/berries/hyper/${id}.webp`;
}

/** Regular berry item art (PokeAPI). Pass `hyper: true` for local Hyper bag sprites. */
export function berrySpriteUrl(id: string, opts?: { hyper?: boolean }): string {
  if (opts?.hyper) return hyperBerrySpriteUrl(id);
  return `${REGULAR_BERRY_SPRITE}/${id}-berry.png`;
}

export function berryDisplayName(berry: TipBerry): string {
  const base = berry.id.charAt(0).toUpperCase() + berry.id.slice(1);
  const name = berry.hyper ? `Hyper ${base}` : base;
  return berry.optional ? `${name} (optional)` : name;
}

export function capitalizeBerryId(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
