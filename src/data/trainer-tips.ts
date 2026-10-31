/** Berry slug: regular PokeAPI art, or `/berries/hyper/{id}.webp` when `hyper`. */
export type TipBerry = {
  id: string;
  count: number;
  /** ZA Mega Dimension Hyper Berry (uses Hyper bag art). */
  hyper?: boolean;
  optional?: boolean;
};

export type TipRecipe = {
  /** Donut / mission name when relevant. */
  label?: string;
  /** Local special-donut art slug under `/donuts/{id}.webp`. */
  donut?: string;
  ingredients: TipBerry[];
  note?: string;
};

/** Species shown in counter / moveset tips. */
export type TipSpecies = {
  id: number;
  name: string;
  slug: string;
  /** Prefer mega art when available. */
  mega?: boolean;
  /** Showdown dex slug override (e.g. `absol-mega-z`). */
  spriteSlug?: string;
};

export type TipCounterBuild = {
  pokemon: TipSpecies;
  moves: string[];
  note?: string;
};

export type TipMegaFight = {
  label: string;
  boss: TipSpecies;
  types: string[];
  weaknesses: string[];
  note?: string;
  counters: TipCounterBuild[];
};

export type TipBlock =
  | { type: 'text'; body: string }
  | { type: 'recipes'; title: string; goal: string; recipes: TipRecipe[] }
  | { type: 'bullets'; items: string[] }
  | { type: 'mega-fights'; title: string; goal: string; fights: TipMegaFight[] };

export type TipSection = {
  title: string;
  blocks: TipBlock[];
};

export type GameTips = {
  id: string;
  title: string;
  sourceUrl?: string;
  sections: TipSection[];
};

function b(id: string, count: number, opts?: { hyper?: boolean; optional?: boolean }): TipBerry {
  return { id, count, ...opts };
}

function mon(id: number, name: string, slug: string, opts?: { mega?: boolean; spriteSlug?: string }): TipSpecies {
  return { id, name, slug, ...opts };
}

function build(pokemon: TipSpecies, moves: string[], note?: string): TipCounterBuild {
  return note ? { pokemon, moves, note } : { pokemon, moves };
}

const H = true;
const M = true;

/** Curated tips by family id (`za`, `swsh`, …). Missing ids = empty state. */
export const trainerTipsById: Record<string, GameTips> = {
  za: {
    id: 'za',
    title: 'Legends: Z-A',
    sourceUrl: 'https://game8.co/games/Pokemon-Legends-Z-A/archives/570965',
    sections: [
      {
        title: 'Hyperspace mission bosses',
        blocks: [
          {
            type: 'text',
            body: 'Match donut ★ to the arena. Special recipes unlock from Ansha during the mission — pick the named recipe option, then use these mixes (or substitutes that hit the flavor totals).',
          },
          {
            type: 'recipes',
            title: 'Story rogue megas',
            goal: 'Regular donuts — hit the listed star rank (Flavor Score).',
            recipes: [
              {
                label: 'Mega Absol Z · Survey No. 1 · 1★ arena',
                ingredients: [b('occa', 1), b('wacan', 1), b('yache', 1)],
                note: '1★ · early berries · Fairy recommended',
              },
              {
                label: 'Mega Staraptor · Survey No. 2 · 2★ arena',
                ingredients: [b('aspear', 3, { hyper: H }), b('hondew', 2, { hyper: H })],
                note: '2★ · Nice Butter (4 berries) · Electric / Fairy / Ice',
              },
              {
                label: 'Mega Tatsugiri · Survey No. 3 · 3★ arena',
                ingredients: [b('pomeg', 5, { hyper: H })],
                note: '3★ · Great Butter (5 berries) · Fairy / Dragon',
              },
              {
                label: 'Mega Meowstic · Survey No. 4 · 3★ arena',
                ingredients: [b('qualot', 3, { hyper: H }), b('hondew', 2, { hyper: H })],
                note: '3★ · Amazing Butter (6 berries) · Bug / Ghost / Dark',
              },
              {
                label: 'Mega Heatran · Survey No. 5 · 4★ arena',
                ingredients: [b('coba', 4, { hyper: H }), b('charti', 4, { hyper: H })],
                note: '4★ · Spicy/Bitter for offense/defense powers · Ground ×4',
              },
            ],
          },
          {
            type: 'recipes',
            title: 'Special donuts (legendary portals)',
            goal: 'Talk to Ansha → named recipe. Epice Noire / salts are added for you.',
            recipes: [
              {
                label: 'Bad Dreams Cruller · Mission 11 · Mega Darkrai',
                donut: 'bad-dreams-cruller',
                ingredients: [
                  b('tanga', 3, { hyper: H }),
                  b('kasib', 3, { hyper: H }),
                  b('coba', 1, { hyper: H }),
                  b('yache', 1, { hyper: H }),
                ],
                note: '310 Sweet · 100 Spicy · 310 Sour · 40 Bitter · 40 Fresh · Coba can be Rindo',
              },
              {
                label: 'Omega Old Fashioned · Mission 13 · Primal Groudon',
                donut: 'omega-old-fashioned',
                ingredients: [
                  b('haban', 2, { hyper: H }),
                  b('tamato', 1, { hyper: H }),
                  b('tanga', 1, { hyper: H }),
                  b('colbur', 1, { hyper: H }),
                  b('chilan', 1, { hyper: H }),
                  b('roseli', 1, { hyper: H }),
                  b('oran', 1, { hyper: H, optional: true }),
                ],
                note: '260 Sweet · 160 Spicy · 160 Sour · 20 Bitter · 260 Fresh · optional 7th any berry',
              },
              {
                label: 'Alpha Old Fashioned · Mission 14 · Primal Kyogre',
                donut: 'alpha-old-fashioned',
                ingredients: [
                  b('payapa', 2, { hyper: H }),
                  b('kelpsy', 1, { hyper: H }),
                  b('yache', 1, { hyper: H }),
                  b('kebia', 1, { hyper: H }),
                  b('kasib', 1, { hyper: H }),
                  b('colbur', 1, { hyper: H }),
                  b('chilan', 1, { hyper: H }),
                ],
                note: '50 Sweet · 50 Spicy · 210 Sour · 180 Bitter · 370 Fresh',
              },
              {
                label: 'Delta Old Fashioned · Mission 12 · Mega Rayquaza',
                donut: 'delta-old-fashioned',
                ingredients: [
                  b('oran', 1, { hyper: H }),
                  b('yache', 1, { hyper: H }),
                  b('payapa', 1, { hyper: H }),
                  b('kasib', 1, { hyper: H }),
                  b('haban', 1, { hyper: H }),
                  b('colbur', 2, { hyper: H }),
                  b('roseli', 1, { hyper: H }),
                ],
                note: '120 Sweet · 40 Spicy · 340 Sour · 40 Bitter · 390 Fresh · after Groudon + Kyogre',
              },
              {
                label: 'Plasma-Glazed · Side EX3 · Mega Zeraora',
                donut: 'plasma-glazed',
                ingredients: [
                  b('kebia', 1, { hyper: H }),
                  b('charti', 1, { hyper: H }),
                  b('kasib', 4, { hyper: H }),
                  b('chilan', 2, { hyper: H }),
                ],
                note: '40 Sweet · 200 Spicy · 400 Sour · 280 Bitter · 40 Fresh · after Rayquaza',
              },
            ],
          },
        ],
      },
      {
        title: 'Shiny & Alpha hunting',
        blocks: [
          {
            type: 'text',
            body: 'Stack Sweet for Sparkling Power + Alpha Power. Fresh on the side can also roll Encounter Power (faster respawns after KO).',
          },
          {
            type: 'recipes',
            title: 'Sweet donuts',
            goal: 'Aim for Sparkling + Alpha (match Sparkling type to your hunt).',
            recipes: [
              {
                ingredients: [b('haban', 8, { hyper: H })],
                note: 'Sweet 680 · Fresh 520 — best all-rounder',
              },
              {
                ingredients: [b('tanga', 4, { hyper: H }), b('haban', 4, { hyper: H })],
                note: 'Sweet 720 · Fresh 260',
              },
              {
                ingredients: [b('haban', 3, { hyper: H }), b('occa', 3, { hyper: H }), b('tanga', 2, { hyper: H })],
                note: 'Sweet 625 · Fresh 270',
              },
            ],
          },
        ],
      },
      {
        title: 'Item & berry farming',
        blocks: [
          {
            type: 'text',
            body: 'Stack Sour for Big Haul Power + Item Power. Prefer Item Power: Berries when grinding Hyper Berries in Hyperspace.',
          },
          {
            type: 'recipes',
            title: 'Sour donuts',
            goal: 'Big Haul Lv. 3 + Item Power: Berries Lv. 3 when you can reroll.',
            recipes: [
              { ingredients: [b('kasib', 8, { hyper: H })], note: 'Sour 760' },
              {
                ingredients: [b('kasib', 4, { hyper: H }), b('roseli', 4, { hyper: H })],
                note: 'Sour 720',
              },
              {
                ingredients: [b('kasib', 4, { hyper: H }), b('colbur', 2, { hyper: H }), b('babiri', 2, { hyper: H })],
                note: 'Sour 640',
              },
              {
                ingredients: [b('wacan', 6, { hyper: H }), b('hondew', 1, { hyper: H }), b('grepa', 1, { hyper: H })],
                note: 'Sour 420',
              },
              {
                ingredients: [b('kasib', 3, { hyper: H }), b('colbur', 2, { hyper: H }), b('chilan', 2, { hyper: H })],
                note: 'Sour 415',
              },
              {
                ingredients: [
                  b('roseli', 2, { hyper: H }),
                  b('payapa', 1, { hyper: H }),
                  b('kasib', 1, { hyper: H }),
                  b('colbur', 3, { hyper: H }),
                ],
                note: 'Sour 470',
              },
            ],
          },
          {
            type: 'recipes',
            title: 'Cheap berry-farm donut',
            goal: 'Item Power: Berries on a 5★ donut for 4★/5★ zones. Seven slots + optional 8th.',
            recipes: [
              {
                ingredients: [
                  b('payapa', 1, { hyper: H }),
                  b('tanga', 1, { hyper: H }),
                  b('kasib', 1, { hyper: H }),
                  b('colbur', 1, { hyper: H }),
                  b('babiri', 1, { hyper: H }),
                  b('roseli', 1, { hyper: H }),
                  b('babiri', 1, { hyper: H, optional: true }),
                ],
                note: 'Sour ~330 · cost-efficient mix',
              },
            ],
          },
        ],
      },
      {
        title: 'Extra story donuts',
        blocks: [
          {
            type: 'recipes',
            title: 'More mixes by stage',
            goal: 'Use these for surveys when you need calories or a different flavor profile.',
            recipes: [
              { ingredients: [b('pecha', 3)], note: 'Early · +3 · 180 cal' },
              {
                ingredients: [b('cheri', 3, { hyper: H }), b('oran', 1, { hyper: H }), b('pomeg', 1, { hyper: H })],
                note: 'Mid · +33 · 564 cal',
              },
              {
                ingredients: [
                  b('oran', 2, { hyper: H }),
                  b('coba', 1, { hyper: H }),
                  b('charti', 1, { hyper: H }),
                  b('chilan', 4, { hyper: H }),
                ],
                note: 'Late · +99 · 3345 cal',
              },
              {
                ingredients: [b('chilan', 6, { hyper: H }), b('kelpsy', 2)],
                note: 'Late · +87 · 3525 cal',
              },
              {
                ingredients: [b('rindo', 3, { hyper: H }), b('kebia', 3, { hyper: H }), b('oran', 2, { hyper: H })],
                note: 'Late · +84 · 2268 cal',
              },
            ],
          },
        ],
      },
      {
        title: 'Rogue Mega counters & movesets',
        blocks: [
          {
            type: 'text',
            body: 'Match type advantage, Mega Evolve (or Plus Moves) when you can, and dodge wide AOEs — recall your Pokémon during chaotic charge attacks. One versatile pair covers most silhouette Rogue Megas.',
          },
          {
            type: 'bullets',
            items: [
              'Gourgeist (or Pumpkaboo): Trick-or-Treat → Light Screen → Safeguard → Phantom Force — paint Ghost onto the boss.',
              'Annihilape: Focus Energy → Screech → Bulk Up while tanking hits, then Rage Fist (Plus Move when possible). Shell Bell + Adamant works well.',
              'Against Fire-weak bosses, Mega Heatran (Magma Storm + Heat Wave) is a strong alternate sweeper.',
              'DLC staples with broad coverage: Gardevoir, Garchomp, Greninja, Lucario, Raichu, Charizard.',
            ],
          },
          {
            type: 'mega-fights',
            title: 'Hyperspace story Rogue Megas',
            goal: 'Survey / portal bosses — recommended counters and sample movesets.',
            fights: [
              {
                label: 'Mega Absol Z · Survey No. 1 · 1★',
                boss: mon(359, 'Absol Z', 'absol', { mega: M, spriteSlug: 'absol-mega-z' }),
                types: ['Dark', 'Ghost'],
                weaknesses: ['Fairy'],
                note: 'Only Fairy hits SE. Dodge the ground-slash charge (triples under 50%).',
                counters: [
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Calm Mind',
                    'Shadow Ball',
                  ]),
                  build(mon(716, 'Xerneas', 'xerneas'), ['Moonblast', 'Geomancy', 'Focus Blast', 'Thunderbolt']),
                  build(mon(36, 'Clefable', 'clefable', { mega: M }), [
                    'Moonblast',
                    'Soft-Boiled',
                    'Calm Mind',
                    'Fire Blast',
                  ]),
                ],
              },
              {
                label: 'Mega Staraptor · Survey No. 2 · 2★',
                boss: mon(398, 'Staraptor', 'staraptor', { mega: M }),
                types: ['Fighting', 'Flying'],
                weaknesses: ['Electric', 'Psychic', 'Ice', 'Fairy', 'Flying'],
                note: 'Roll through the dive-bomb charge; fireballs are slow.',
                counters: [
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Psychic',
                    'Moonblast',
                    'Thunderbolt',
                    'Calm Mind',
                  ]),
                  build(mon(181, 'Ampharos', 'ampharos', { mega: M }), [
                    'Thunderbolt',
                    'Dragon Pulse',
                    'Focus Blast',
                    'Thunder Wave',
                  ]),
                  build(mon(150, 'Mewtwo', 'mewtwo', { mega: M }), ['Psystrike', 'Ice Beam', 'Aura Sphere', 'Recover']),
                ],
              },
              {
                label: 'Mega Tatsugiri · Survey No. 3 · 3★',
                boss: mon(978, 'Tatsugiri', 'tatsugiri', { mega: M, spriteSlug: 'tatsugiri-curly-mega' }),
                types: ['Dragon', 'Water'],
                weaknesses: ['Dragon', 'Fairy'],
                note: 'Very mobile — recall during the masago charge and keep moving.',
                counters: [
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Thunderbolt',
                    'Calm Mind',
                  ]),
                  build(mon(716, 'Xerneas', 'xerneas'), ['Moonblast', 'Geomancy', 'Thunderbolt', 'Focus Blast']),
                  build(mon(384, 'Rayquaza', 'rayquaza', { mega: M }), [
                    'Dragon Ascent',
                    'Outrage',
                    'Earthquake',
                    'Extreme Speed',
                  ]),
                ],
              },
              {
                label: 'Mega Meowstic · Survey No. 4 · 3★',
                boss: mon(678, 'Meowstic', 'meowstic', { mega: M, spriteSlug: 'meowstic-male-mega' }),
                types: ['Psychic'],
                weaknesses: ['Bug', 'Ghost', 'Dark'],
                note: 'Break the psychic box from the weak face (odd square), then stand inside before it detonates.',
                counters: [
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Focus Energy']),
                  build(mon(359, 'Absol', 'absol', { mega: M }), [
                    'Night Slash',
                    'Sucker Punch',
                    'Psycho Cut',
                    'Swords Dance',
                  ]),
                  build(mon(491, 'Darkrai', 'darkrai', { mega: M }), [
                    'Dark Pulse',
                    'Nasty Plot',
                    'Focus Blast',
                    'Sludge Bomb',
                  ]),
                ],
              },
              {
                label: 'Mega Heatran · Survey No. 5 · 4★',
                boss: mon(485, 'Heatran', 'heatran', { mega: M }),
                types: ['Fire', 'Steel'],
                weaknesses: ['Ground (×4)', 'Water', 'Fighting'],
                note: 'Stationary wall — Ground is best. Flee magma balls / fire circles on the charge.',
                counters: [
                  build(mon(445, 'Garchomp', 'garchomp', { mega: M }), [
                    'Earthquake',
                    'Dragon Claw',
                    'Swords Dance',
                    'Stone Edge',
                  ]),
                  build(mon(530, 'Excadrill', 'excadrill'), ['Earthquake', 'Iron Head', 'Rock Slide', 'Swords Dance']),
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Screech']),
                ],
              },
              {
                label: 'Mega Darkrai · Mission 11 · 5★',
                boss: mon(491, 'Darkrai', 'darkrai', { mega: M }),
                types: ['Dark'],
                weaknesses: ['Fighting', 'Bug', 'Fairy'],
                note: 'Two phases. Heal sleep; at Mega charge, clones ring the arena — safe spot is center (or roll).',
                counters: [
                  build(mon(448, 'Lucario', 'lucario', { mega: M }), [
                    'Close Combat',
                    'Bullet Punch',
                    'Swords Dance',
                    'Extreme Speed',
                  ]),
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Focus Blast',
                    'Calm Mind',
                  ]),
                  build(mon(214, 'Heracross', 'heracross', { mega: M }), [
                    'Megahorn',
                    'Close Combat',
                    'Rock Blast',
                    'Swords Dance',
                  ]),
                ],
              },
              {
                label: 'Primal Groudon · Omega Old-Fashioned · 5★',
                boss: mon(383, 'Groudon', 'groudon'),
                types: ['Ground', 'Fire', 'Ground'],
                weaknesses: ['Water', 'Grass', 'Ice', 'Ground'],
                note: 'Two phases: Ground → Fire/Ground. Primal still blocks Water — bring Ground for phase 2. Recall on lava pulses.',
                counters: [
                  build(mon(445, 'Garchomp', 'garchomp', { mega: M }), [
                    'Earthquake',
                    'Dragon Claw',
                    'Swords Dance',
                    'Fire Fang',
                  ]),
                  build(
                    mon(260, 'Swampert', 'swampert', { mega: M }),
                    ['Earthquake', 'Waterfall', 'Ice Punch', 'Bulk Up'],
                    'Water only for phase 1',
                  ),
                  build(
                    mon(478, 'Froslass', 'froslass', { mega: M }),
                    ['Blizzard', 'Shadow Ball', 'Thunderbolt', 'Destiny Bond'],
                    'Phase 1 Ice coverage',
                  ),
                ],
              },
              {
                label: 'Primal Kyogre · Alpha Old-Fashioned · 5★',
                boss: mon(382, 'Kyogre', 'kyogre'),
                types: ['Water'],
                weaknesses: ['Electric', 'Grass'],
                note: 'Two phases, same typing. Watch stream telegraph lines on the charge.',
                counters: [
                  build(mon(181, 'Ampharos', 'ampharos', { mega: M }), [
                    'Thunderbolt',
                    'Dragon Pulse',
                    'Focus Blast',
                    'Thunder Wave',
                  ]),
                  build(mon(154, 'Meganium', 'meganium', { mega: M }), [
                    'Giga Drain',
                    'Synthesis',
                    'Leech Seed',
                    'Earthquake',
                  ]),
                  build(mon(26, 'Raichu', 'raichu', { mega: M }), ['Thunderbolt', 'Surf', 'Focus Blast', 'Nasty Plot']),
                ],
              },
              {
                label: 'Mega Rayquaza · Delta Old-Fashioned · 5★',
                boss: mon(384, 'Rayquaza', 'rayquaza', { mega: M }),
                types: ['Dragon', 'Flying'],
                weaknesses: ['Ice (×4)', 'Rock', 'Dragon', 'Fairy'],
                note: 'Interrupt / survive Dragon Ascent tornado. Ice is by far the best answer.',
                counters: [
                  build(mon(478, 'Froslass', 'froslass', { mega: M }), [
                    'Blizzard',
                    'Shadow Ball',
                    'Thunderbolt',
                    'Destiny Bond',
                  ]),
                  build(mon(460, 'Abomasnow', 'abomasnow', { mega: M }), [
                    'Blizzard',
                    'Wood Hammer',
                    'Earthquake',
                    'Ice Shard',
                  ]),
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Thunderbolt',
                    'Calm Mind',
                  ]),
                ],
              },
              {
                label: 'Mega Zeraora · Plasma-Glazed · 5★',
                boss: mon(807, 'Zeraora', 'zeraora', { mega: M }),
                types: ['Electric'],
                weaknesses: ['Ground'],
                note: 'Only Ground is SE. Cure paralysis. Put Pokémon away for the zigzag edge charge under 50%.',
                counters: [
                  build(mon(445, 'Garchomp', 'garchomp', { mega: M }), [
                    'Earthquake',
                    'Dragon Claw',
                    'Swords Dance',
                    'Stone Edge',
                  ]),
                  build(mon(530, 'Excadrill', 'excadrill'), ['Earthquake', 'Iron Head', 'Rock Slide', 'Swords Dance']),
                  build(mon(260, 'Swampert', 'swampert', { mega: M }), [
                    'Earthquake',
                    'Waterfall',
                    'Ice Punch',
                    'Bulk Up',
                  ]),
                ],
              },
            ],
          },
          {
            type: 'mega-fights',
            title: 'Silhouette Rogue Megas (quick picks)',
            goal: 'Hyperspace silhouette arenas — top counters from the type chart (Annihilape still works on most via Trick-or-Treat).',
            fights: [
              {
                label: 'Mega Absol',
                boss: mon(359, 'Absol', 'absol', { mega: M }),
                types: ['Dark'],
                weaknesses: ['Fighting', 'Bug', 'Fairy'],
                counters: [
                  build(mon(448, 'Lucario', 'lucario', { mega: M }), [
                    'Close Combat',
                    'Bullet Punch',
                    'Swords Dance',
                    'Extreme Speed',
                  ]),
                  build(mon(716, 'Xerneas', 'xerneas'), ['Moonblast', 'Geomancy', 'Focus Blast', 'Thunderbolt']),
                ],
              },
              {
                label: 'Mega Slowbro',
                boss: mon(80, 'Slowbro', 'slowbro', { mega: M }),
                types: ['Water', 'Psychic'],
                weaknesses: ['Bug', 'Ghost', 'Dark', 'Electric', 'Grass'],
                counters: [
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Focus Energy']),
                  build(mon(359, 'Absol', 'absol', { mega: M }), [
                    'Night Slash',
                    'Sucker Punch',
                    'Psycho Cut',
                    'Swords Dance',
                  ]),
                ],
              },
              {
                label: 'Mega Camerupt',
                boss: mon(323, 'Camerupt', 'camerupt', { mega: M }),
                types: ['Fire', 'Ground'],
                weaknesses: ['Water (×4)', 'Ground'],
                counters: [
                  build(mon(130, 'Gyarados', 'gyarados', { mega: M }), [
                    'Waterfall',
                    'Earthquake',
                    'Dragon Dance',
                    'Ice Fang',
                  ]),
                  build(mon(160, 'Feraligatr', 'feraligatr', { mega: M }), [
                    'Waterfall',
                    'Ice Punch',
                    'Crunch',
                    'Swords Dance',
                  ]),
                ],
              },
              {
                label: 'Mega Victreebel / Beedrill / Mawile / Venusaur',
                boss: mon(71, 'Victreebel', 'victreebel', { mega: M }),
                types: ['Grass', 'Poison', 'Bug', 'Steel', 'Fairy'],
                weaknesses: ['Fire (×2+)'],
                note: 'Victreebel / Beedrill / Mawile / Venusaur — Fire-weak group. Mega Heatran or Fire STAB sweepers shine here.',
                counters: [
                  build(mon(485, 'Heatran', 'heatran', { mega: M }), [
                    'Magma Storm',
                    'Heat Wave',
                    'Earth Power',
                    'Flash Cannon',
                  ]),
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Focus Energy']),
                ],
              },
              {
                label: 'Mega Hawlucha / Staraptor-likes',
                boss: mon(701, 'Hawlucha', 'hawlucha', { mega: M }),
                types: ['Fighting', 'Flying'],
                weaknesses: ['Electric', 'Psychic', 'Fairy', 'Ice', 'Flying'],
                counters: [
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Psychic',
                    'Moonblast',
                    'Thunderbolt',
                    'Calm Mind',
                  ]),
                  build(mon(181, 'Ampharos', 'ampharos', { mega: M }), [
                    'Thunderbolt',
                    'Dragon Pulse',
                    'Focus Blast',
                    'Thunder Wave',
                  ]),
                ],
              },
              {
                label: 'Mega Banette / Meowstic-likes',
                boss: mon(354, 'Banette', 'banette', { mega: M }),
                types: ['Ghost'],
                weaknesses: ['Dark', 'Ghost'],
                counters: [
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Screech']),
                  build(mon(359, 'Absol', 'absol', { mega: M }), [
                    'Night Slash',
                    'Sucker Punch',
                    'Shadow Claw',
                    'Swords Dance',
                  ]),
                ],
              },
              {
                label: 'Mega Ampharos',
                boss: mon(181, 'Ampharos', 'ampharos', { mega: M }),
                types: ['Electric', 'Dragon'],
                weaknesses: ['Ground', 'Ice', 'Dragon', 'Fairy'],
                counters: [
                  build(mon(530, 'Excadrill', 'excadrill'), ['Earthquake', 'Iron Head', 'Rock Slide', 'Swords Dance']),
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Thunderbolt',
                    'Calm Mind',
                  ]),
                ],
              },
              {
                label: 'Mega Froslass',
                boss: mon(478, 'Froslass', 'froslass', { mega: M }),
                types: ['Ice', 'Ghost'],
                weaknesses: ['Fire', 'Rock', 'Ghost', 'Dark', 'Steel'],
                counters: [
                  build(mon(485, 'Heatran', 'heatran', { mega: M }), [
                    'Magma Storm',
                    'Heat Wave',
                    'Earth Power',
                    'Flash Cannon',
                  ]),
                  build(mon(530, 'Excadrill', 'excadrill'), ['Iron Head', 'Earthquake', 'Rock Slide', 'Swords Dance']),
                ],
              },
              {
                label: 'Mega Altaria / Dragonite',
                boss: mon(334, 'Altaria', 'altaria', { mega: M }),
                types: ['Dragon', 'Flying'],
                weaknesses: ['Ice (×4)', 'Rock', 'Dragon', 'Fairy'],
                counters: [
                  build(mon(530, 'Excadrill', 'excadrill'), ['Iron Head', 'Earthquake', 'Rock Slide', 'Swords Dance']),
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Thunderbolt',
                    'Ice Beam',
                  ]),
                ],
              },
              {
                label: 'Mega Tyranitar',
                boss: mon(248, 'Tyranitar', 'tyranitar', { mega: M }),
                types: ['Rock', 'Dark'],
                weaknesses: ['Fighting (×4)', 'Bug', 'Fairy', 'Ground', 'Steel', 'Water', 'Grass'],
                counters: [
                  build(mon(282, 'Gardevoir', 'gardevoir', { mega: M }), [
                    'Moonblast',
                    'Psychic',
                    'Focus Blast',
                    'Calm Mind',
                  ]),
                  build(mon(214, 'Heracross', 'heracross', { mega: M }), [
                    'Close Combat',
                    'Megahorn',
                    'Rock Blast',
                    'Swords Dance',
                  ]),
                  build(mon(448, 'Lucario', 'lucario', { mega: M }), [
                    'Close Combat',
                    'Bullet Punch',
                    'Swords Dance',
                    'Extreme Speed',
                  ]),
                ],
              },
              {
                label: 'Mega Starmie / Barbaracle',
                boss: mon(121, 'Starmie', 'starmie', { mega: M }),
                types: ['Water', 'Psychic'],
                weaknesses: ['Electric', 'Grass', 'Ghost', 'Dark', 'Bug'],
                counters: [
                  build(mon(979, 'Annihilape', 'annihilape'), ['Rage Fist', 'Close Combat', 'Bulk Up', 'Focus Energy']),
                  build(mon(181, 'Ampharos', 'ampharos', { mega: M }), [
                    'Thunderbolt',
                    'Dragon Pulse',
                    'Focus Blast',
                    'Thunder Wave',
                  ]),
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Hyperspace quick tips',
        blocks: [
          {
            type: 'bullets',
            items: [
              'Finish every survey task in a zone so the gold Bonus Ball appears — best Hyper Berry haul.',
              'Courier trainers (yellow dialogue after battle) often reward Hyper Berries.',
              'Higher ★ Hyperspace zones drop better Hyper Berries and rarer items (4★/5★ preferred).',
              '5★ battle zones unlock after Side Mission 188 (once all Hyperspace missions are done).',
            ],
          },
        ],
      },
    ],
  },
};
