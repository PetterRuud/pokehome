/** Official battle types used for move chips. */
export type PokemonType =
  | 'normal'
  | 'fire'
  | 'water'
  | 'electric'
  | 'grass'
  | 'ice'
  | 'fighting'
  | 'poison'
  | 'ground'
  | 'flying'
  | 'psychic'
  | 'bug'
  | 'rock'
  | 'ghost'
  | 'dragon'
  | 'dark'
  | 'steel'
  | 'fairy';

/** Classic type chip colors (readable on light + dark). */
export const TYPE_BADGE_CLASS: Record<PokemonType, string> = {
  normal: 'border-transparent bg-[#A8A878] text-white',
  fire: 'border-transparent bg-[#F08030] text-white',
  water: 'border-transparent bg-[#6890F0] text-white',
  electric: 'border-transparent bg-[#F8D030] text-[#403010]',
  grass: 'border-transparent bg-[#78C850] text-white',
  ice: 'border-transparent bg-[#98D8D8] text-[#204040]',
  fighting: 'border-transparent bg-[#C03028] text-white',
  poison: 'border-transparent bg-[#A040A0] text-white',
  ground: 'border-transparent bg-[#E0C068] text-[#403010]',
  flying: 'border-transparent bg-[#A890F0] text-white',
  psychic: 'border-transparent bg-[#F85888] text-white',
  bug: 'border-transparent bg-[#A8B820] text-white',
  rock: 'border-transparent bg-[#B8A038] text-white',
  ghost: 'border-transparent bg-[#705898] text-white',
  dragon: 'border-transparent bg-[#7038F8] text-white',
  dark: 'border-transparent bg-[#705848] text-white',
  steel: 'border-transparent bg-[#B8B8D0] text-[#303040]',
  fairy: 'border-transparent bg-[#EE99AC] text-[#402030]',
};

/** White SVG icons need a dark filter on pale type chips. */
const TYPE_ICON_DARK: Partial<Record<PokemonType, true>> = {
  electric: true,
  ice: true,
  ground: true,
  steel: true,
  fairy: true,
};

/** Moves referenced in trainer tips → typing. */
const MOVE_TYPE_BY_NAME: Record<string, PokemonType> = {
  'aura sphere': 'fighting',
  blizzard: 'ice',
  'bulk up': 'fighting',
  'bullet punch': 'steel',
  'calm mind': 'psychic',
  'close combat': 'fighting',
  crunch: 'dark',
  'dark pulse': 'dark',
  'destiny bond': 'ghost',
  'dragon ascent': 'flying',
  'dragon claw': 'dragon',
  'dragon dance': 'dragon',
  'dragon pulse': 'dragon',
  'earth power': 'ground',
  earthquake: 'ground',
  'extreme speed': 'normal',
  'fire blast': 'fire',
  'fire fang': 'fire',
  'flash cannon': 'steel',
  'focus blast': 'fighting',
  'focus energy': 'normal',
  geomancy: 'fairy',
  'giga drain': 'grass',
  'heat wave': 'fire',
  'ice beam': 'ice',
  'ice fang': 'ice',
  'ice punch': 'ice',
  'ice shard': 'ice',
  'iron head': 'steel',
  'leech seed': 'grass',
  'magma storm': 'fire',
  megahorn: 'bug',
  moonblast: 'fairy',
  'nasty plot': 'dark',
  'night slash': 'dark',
  outrage: 'dragon',
  'phantom force': 'ghost',
  psychic: 'psychic',
  'psycho cut': 'psychic',
  psystrike: 'psychic',
  'rage fist': 'ghost',
  recover: 'normal',
  'rock blast': 'rock',
  'rock slide': 'rock',
  screech: 'normal',
  'shadow ball': 'ghost',
  'shadow claw': 'ghost',
  'sludge bomb': 'poison',
  'soft-boiled': 'normal',
  'stone edge': 'rock',
  'sucker punch': 'dark',
  surf: 'water',
  'swords dance': 'normal',
  synthesis: 'grass',
  'thunder wave': 'electric',
  thunderbolt: 'electric',
  'trick-or-treat': 'ghost',
  waterfall: 'water',
  'wood hammer': 'grass',
};

const ALL_TYPES = Object.keys(TYPE_BADGE_CLASS) as PokemonType[];

export function moveType(move: string): PokemonType {
  return MOVE_TYPE_BY_NAME[move.trim().toLowerCase()] ?? 'normal';
}

/** Resolve a type from labels like `Ice (×4)`, `Fire (common)`, or plain `Dragon`. */
export function parsePokemonType(label: string): PokemonType | null {
  const lower = label.trim().toLowerCase();
  if (!lower || lower === 'varies') return null;
  let best: { type: PokemonType; index: number } | null = null;
  for (const type of ALL_TYPES) {
    const idx = lower.indexOf(type);
    if (idx < 0) continue;
    if (!best || idx < best.index || (idx === best.index && type.length > best.type.length)) {
      best = { type, index: idx };
    }
  }
  return best?.type ?? null;
}

export function typeIconUrl(type: PokemonType): string {
  return `/types/${type}.svg`;
}

export function typeIconClass(type: PokemonType): string {
  return TYPE_ICON_DARK[type] ? 'brightness-0' : '';
}

export function typeBadgeClass(type: PokemonType): string {
  return TYPE_BADGE_CLASS[type];
}

export function moveTypeBadgeClass(move: string): string {
  return typeBadgeClass(moveType(move));
}
