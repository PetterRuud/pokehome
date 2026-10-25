import type { TipBerry } from '@/data/trainer-tips';

/**
 * Official Mega Dimension Hyper Berry set (Game8 / in-game order).
 * Slugs match local Hyper sprites under `/berries/hyper/{id}.webp`.
 */
export const HYPER_BERRY_IDS = [
  'cheri',
  'chesto',
  'pecha',
  'rawst',
  'aspear',
  'oran',
  'persim',
  'lum',
  'sitrus',
  'pomeg',
  'kelpsy',
  'qualot',
  'hondew',
  'grepa',
  'tamato',
  'occa',
  'passho',
  'wacan',
  'rindo',
  'yache',
  'chople',
  'kebia',
  'shuca',
  'coba',
  'payapa',
  'tanga',
  'charti',
  'kasib',
  'haban',
  'colbur',
  'babiri',
  'chilan',
  'roseli',
] as const;

export type HyperBerryId = (typeof HYPER_BERRY_IDS)[number];

/**
 * Short farm tips from Serebii (floating/Bonus Balls by ★ + Courier battle rewards).
 * Courier star is the battle-zone rank that drops that berry.
 */
const HYPER_BERRY_HOWTO: Record<HyperBerryId, string> = {
  cheri: '1★ balls & Bonus Ball',
  chesto: '1★ balls & Bonus Ball',
  pecha: '1★ balls & Bonus Ball',
  rawst: '1★ balls & Bonus Ball',
  aspear: '1★ balls & Bonus Ball',
  oran: '1–2★ balls & Bonus Ball',
  persim: '1–2★ balls & Bonus Ball',
  lum: '1–2★ balls & Bonus Ball',
  sitrus: '1–2★ balls & Bonus Ball',
  pomeg: '2★ courier · 2–3★ balls',
  kelpsy: '2★ courier · 2–3★ balls',
  qualot: '2★ courier · 2–3★ balls',
  hondew: '2★ courier · 2–3★ balls',
  grepa: '3★ courier · 3★ balls',
  tamato: '3★ courier · 3★ balls',
  occa: '3★ courier · 3★ balls',
  passho: '3★ courier · 3★ balls',
  wacan: '3★ courier · 3★ balls',
  rindo: '3–4★ balls & Bonus Ball',
  yache: '3–4★ balls & Bonus Ball',
  chople: '3–4★ balls & Bonus Ball',
  kebia: '3–4★ balls & Bonus Ball',
  shuca: '3–4★ balls & Bonus Ball',
  coba: '4★ courier · 4–5★ balls',
  payapa: '4★ courier · 4–5★ balls',
  tanga: '4★ courier · 4–5★ balls',
  charti: '4★ courier · 4–5★ balls',
  kasib: '4★ courier · 4–5★ balls',
  haban: '5★ courier · 4–5★ balls',
  colbur: '5★ courier · 4–5★ balls',
  babiri: '5★ courier · 4–5★ balls',
  chilan: '5★ courier · 4–5★ balls',
  roseli: '5★ courier · 4–5★ balls',
};

const REGULAR_BERRY_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

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

/**
 * Total flavor points per Hyper Berry (sum of Sweet/Spicy/Sour/Bitter/Fresh).
 * Source: Game8 / Dexerto Hyper Berry flavor tables.
 */
export const HYPER_BERRY_FLAVOR_SCORE: Record<HyperBerryId, number> = {
  cheri: 40,
  chesto: 40,
  pecha: 40,
  rawst: 40,
  aspear: 40,
  oran: 60,
  persim: 60,
  lum: 60,
  sitrus: 60,
  pomeg: 70,
  kelpsy: 70,
  qualot: 70,
  hondew: 70,
  grepa: 90,
  tamato: 90,
  occa: 90,
  passho: 90,
  wacan: 90,
  rindo: 100,
  yache: 100,
  chople: 100,
  kebia: 100,
  shuca: 100,
  coba: 120,
  payapa: 120,
  tanga: 120,
  charti: 120,
  kasib: 120,
  haban: 150,
  colbur: 150,
  babiri: 150,
  chilan: 150,
  roseli: 150,
};

export function hyperBerryFlavorScore(id: string): number {
  return HYPER_BERRY_FLAVOR_SCORE[id as HyperBerryId] ?? 0;
}

export type BerryFlavors = {
  sweet: number;
  spicy: number;
  sour: number;
  bitter: number;
  fresh: number;
};

/** Per-flavor Hyper Berry stats (Game8). */
export const HYPER_BERRY_FLAVORS: Record<HyperBerryId, BerryFlavors> = {
  cheri: { sweet: 0, spicy: 40, sour: 0, bitter: 0, fresh: 0 },
  chesto: { sweet: 0, spicy: 0, sour: 0, bitter: 0, fresh: 40 },
  pecha: { sweet: 40, spicy: 0, sour: 0, bitter: 0, fresh: 0 },
  rawst: { sweet: 0, spicy: 0, sour: 0, bitter: 40, fresh: 0 },
  aspear: { sweet: 0, spicy: 0, sour: 40, bitter: 0, fresh: 0 },
  oran: { sweet: 10, spicy: 20, sour: 15, bitter: 15, fresh: 0 },
  persim: { sweet: 0, spicy: 15, sour: 15, bitter: 10, fresh: 20 },
  lum: { sweet: 20, spicy: 15, sour: 10, bitter: 0, fresh: 15 },
  sitrus: { sweet: 15, spicy: 10, sour: 0, bitter: 20, fresh: 15 },
  pomeg: { sweet: 30, spicy: 35, sour: 0, bitter: 0, fresh: 5 },
  kelpsy: { sweet: 5, spicy: 0, sour: 0, bitter: 30, fresh: 35 },
  qualot: { sweet: 35, spicy: 0, sour: 30, bitter: 5, fresh: 0 },
  hondew: { sweet: 0, spicy: 5, sour: 35, bitter: 0, fresh: 30 },
  grepa: { sweet: 0, spicy: 60, sour: 25, bitter: 0, fresh: 5 },
  tamato: { sweet: 5, spicy: 25, sour: 0, bitter: 0, fresh: 60 },
  occa: { sweet: 60, spicy: 0, sour: 0, bitter: 5, fresh: 25 },
  passho: { sweet: 25, spicy: 0, sour: 5, bitter: 60, fresh: 0 },
  wacan: { sweet: 0, spicy: 5, sour: 60, bitter: 25, fresh: 0 },
  rindo: { sweet: 15, spicy: 55, sour: 0, bitter: 5, fresh: 25 },
  yache: { sweet: 25, spicy: 0, sour: 5, bitter: 15, fresh: 55 },
  chople: { sweet: 55, spicy: 5, sour: 15, bitter: 25, fresh: 0 },
  kebia: { sweet: 0, spicy: 15, sour: 25, bitter: 55, fresh: 5 },
  shuca: { sweet: 5, spicy: 25, sour: 55, bitter: 0, fresh: 15 },
  coba: { sweet: 10, spicy: 95, sour: 0, bitter: 10, fresh: 5 },
  payapa: { sweet: 5, spicy: 0, sour: 10, bitter: 10, fresh: 95 },
  tanga: { sweet: 95, spicy: 10, sour: 10, bitter: 5, fresh: 0 },
  charti: { sweet: 0, spicy: 10, sour: 5, bitter: 95, fresh: 10 },
  kasib: { sweet: 10, spicy: 5, sour: 95, bitter: 0, fresh: 10 },
  haban: { sweet: 85, spicy: 0, sour: 0, bitter: 0, fresh: 65 },
  colbur: { sweet: 0, spicy: 0, sour: 65, bitter: 0, fresh: 85 },
  babiri: { sweet: 0, spicy: 0, sour: 65, bitter: 85, fresh: 0 },
  chilan: { sweet: 0, spicy: 85, sour: 0, bitter: 65, fresh: 0 },
  roseli: { sweet: 0, spicy: 65, sour: 85, bitter: 0, fresh: 0 },
};

export function hyperBerryFlavors(id: string): BerryFlavors | null {
  return HYPER_BERRY_FLAVORS[id as HyperBerryId] ?? null;
}
