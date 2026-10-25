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

/**
 * Short farm tips from Serebii (floating/Bonus Balls by ★ + Courier battle rewards).
 * Courier star is the battle-zone rank that drops that berry.
 */
const HYPER_BERRY_HOWTO: Record<HyperBerryId, string> = {
  cheri: "1★ balls & Bonus Ball",
  chesto: "1★ balls & Bonus Ball",
  pecha: "1★ balls & Bonus Ball",
  rawst: "1★ balls & Bonus Ball",
  aspear: "1★ balls & Bonus Ball",
  oran: "1–2★ balls & Bonus Ball",
  persim: "1–2★ balls & Bonus Ball",
  lum: "1–2★ balls & Bonus Ball",
  sitrus: "1–2★ balls & Bonus Ball",
  pomeg: "2★ courier · 2–3★ balls",
  kelpsy: "2★ courier · 2–3★ balls",
  qualot: "2★ courier · 2–3★ balls",
  hondew: "2★ courier · 2–3★ balls",
  grepa: "3★ courier · 3★ balls",
  tamato: "3★ courier · 3★ balls",
  occa: "3★ courier · 3★ balls",
  passho: "3★ courier · 3★ balls",
  wacan: "3★ courier · 3★ balls",
  rindo: "3–4★ balls & Bonus Ball",
  yache: "3–4★ balls & Bonus Ball",
  chople: "3–4★ balls & Bonus Ball",
  kebia: "3–4★ balls & Bonus Ball",
  shuca: "3–4★ balls & Bonus Ball",
  coba: "4★ courier · 4–5★ balls",
  payapa: "4★ courier · 4–5★ balls",
  tanga: "4★ courier · 4–5★ balls",
  charti: "4★ courier · 4–5★ balls",
  kasib: "4★ courier · 4–5★ balls",
  haban: "5★ courier · 4–5★ balls",
  colbur: "5★ courier · 4–5★ balls",
  babiri: "5★ courier · 4–5★ balls",
  chilan: "5★ courier · 4–5★ balls",
  roseli: "5★ courier · 4–5★ balls",
};

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
  const name = capitalizeBerryId(berry.id);
  return berry.optional ? `${name} (optional)` : name;
}

export function capitalizeBerryId(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

/** Short farm tip for a Hyper Berry stash row. */
export function hyperBerryHowto(id: string): string | null {
  if (id in HYPER_BERRY_HOWTO) return HYPER_BERRY_HOWTO[id as HyperBerryId];
  return null;
}
