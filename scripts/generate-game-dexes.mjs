/**
 * Generates HOME-style game + DLC dex boxes from PokéAPI (+ form-variants for Mega).
 * Counts match Pokémon HOME mobile regional dexes (mythicals/events excluded where HOME does).
 * Run: node scripts/generate-game-dexes.mjs
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/data/games.json');
const formVariantsPath = join(__dirname, '../src/data/form-variants.json');
const BOX_SIZE = 30;

/** Pokedex slug → regional form region used in that dex. */
const REGION_BY_POKEDEX = {
  galar: 'galar',
  'isle-of-armor': 'galar',
  'crown-tundra': 'galar',
  hisui: 'hisui',
  paldea: 'paldea',
  kitakami: 'paldea',
  blueberry: 'paldea',
};

const REGION_PREFIX = {
  alola: 'Alolan',
  galar: 'Galarian',
  hisui: 'Hisuian',
  paldea: 'Paldean',
};

/**
 * Species whose multiple mega forms share one HOME Mega Evolution Pokédex entry.
 * @type {Set<number>}
 */
const COMBINED_MEGA_SPECIES = new Set([
  678, // Meowstic
  801, // Magearna
  978, // Tatsugiri
]);

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   short: string,
 *   group: string,
 *   groupShort: string,
 *   kind: 'main' | 'dlc' | 'special',
 *   logo: string,
 *   pokedexSlugs: string[],
 *   excludeIds?: number[],
 *   source?: 'pokedex' | 'mega' | 'go',
 * }} GameDef
 */

/** @type {GameDef[]} */
const GAMES = [
  {
    id: 'lgpe',
    name: "Let's Go Pikachu / Eevee",
    short: 'LGPE',
    group: "Let's Go",
    groupShort: 'LGPE',
    kind: 'main',
    logo: 'lgpe',
    pokedexSlugs: ['letsgo-kanto'],
    // HOME Kanto (LGPE): 150 — exclude Mew, Meltan, Melmetal
    excludeIds: [151, 808, 809],
  },
  {
    id: 'frlg',
    name: 'FireRed / LeafGreen',
    short: 'FRLG',
    group: 'FireRed / LeafGreen',
    groupShort: 'FRLG',
    kind: 'main',
    logo: 'frlg',
    pokedexSlugs: ['kanto'],
    // HOME Kanto (GBA): 150 — exclude Mew
    excludeIds: [151],
  },
  {
    id: 'swsh-galar',
    name: 'Galar Pokédex',
    short: 'Galar',
    group: 'Sword / Shield',
    groupShort: 'SwSh',
    kind: 'main',
    logo: 'swsh',
    pokedexSlugs: ['galar'],
  },
  {
    id: 'swsh-ioa',
    name: 'Isle of Armor',
    short: 'IoA',
    group: 'Sword / Shield',
    groupShort: 'SwSh',
    kind: 'dlc',
    logo: 'swsh',
    pokedexSlugs: ['isle-of-armor'],
    // HOME: 210 — exclude Zarude
    excludeIds: [893],
  },
  {
    id: 'swsh-ct',
    name: 'Crown Tundra',
    short: 'CT',
    group: 'Sword / Shield',
    groupShort: 'SwSh',
    kind: 'dlc',
    logo: 'swsh',
    pokedexSlugs: ['crown-tundra'],
  },
  {
    id: 'bdsp',
    name: 'Brilliant Diamond / Shining Pearl',
    short: 'BDSP',
    group: 'BDSP',
    groupShort: 'BDSP',
    kind: 'main',
    logo: 'bdsp',
    pokedexSlugs: ['original-sinnoh'],
    // HOME Sinnoh: 150 — exclude Manaphy
    excludeIds: [490],
  },
  {
    id: 'pla',
    name: 'Legends: Arceus',
    short: 'PLA',
    group: 'Legends: Arceus',
    groupShort: 'PLA',
    kind: 'main',
    logo: 'pla',
    pokedexSlugs: ['hisui'],
  },
  {
    id: 'sv-paldea',
    name: 'Paldea Pokédex',
    short: 'Paldea',
    group: 'Scarlet / Violet',
    groupShort: 'SV',
    kind: 'main',
    logo: 'sv',
    pokedexSlugs: ['paldea'],
  },
  {
    id: 'sv-kitakami',
    name: 'Kitakami Pokédex',
    short: 'Kitakami',
    group: 'Scarlet / Violet',
    groupShort: 'SV',
    kind: 'dlc',
    logo: 'sv',
    pokedexSlugs: ['kitakami'],
  },
  {
    id: 'sv-blueberry',
    name: 'Blueberry Pokédex',
    short: 'Blueberry',
    group: 'Scarlet / Violet',
    groupShort: 'SV',
    kind: 'dlc',
    logo: 'sv',
    pokedexSlugs: ['blueberry'],
    // HOME: 240 — exclude Walking Wake, Iron Leaves, Pecharunt
    excludeIds: [1009, 1010, 1025],
  },
  {
    id: 'za-lumiose',
    name: 'Lumiose Pokédex',
    short: 'Lumiose',
    group: 'Legends: Z-A',
    groupShort: 'Z-A',
    kind: 'main',
    logo: 'za',
    pokedexSlugs: ['lumiose-city'],
    // HOME: 230 — exclude Diancie, Mewtwo
    excludeIds: [719, 150],
  },
  {
    id: 'za-hyperspace',
    name: 'Hyperspace Pokédex',
    short: 'Hyperspace',
    group: 'Legends: Z-A',
    groupShort: 'Z-A',
    kind: 'dlc',
    logo: 'za',
    pokedexSlugs: ['hyperspace'],
    // HOME: 131 — exclude Zeraora
    excludeIds: [807],
  },
  {
    id: 'za-mega',
    name: 'Mega Evolution Pokédex',
    short: 'Mega',
    group: 'Legends: Z-A',
    groupShort: 'Z-A',
    kind: 'special',
    logo: 'mega',
    pokedexSlugs: [],
    source: 'mega',
  },
  {
    id: 'go',
    name: 'Pokémon GO',
    short: 'GO',
    group: 'Pokémon GO',
    groupShort: 'GO',
    kind: 'special',
    logo: 'go',
    pokedexSlugs: ['national'],
    // Mark unreleased species via pogoapi.net released list (still listed in the dex).
    source: 'go',
  },
];

const POGO_RELEASED_URL = 'https://pogoapi.net/api/v1/released_pokemon.json';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function speciesIdFromUrl(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

/**
 * @param {Record<string, any>} regionalMap
 * @param {number} speciesId
 * @param {string | undefined} region
 */
function resolveRegionalForm(regionalMap, speciesId, region) {
  if (!region) return null;
  const entry = regionalMap[String(speciesId)];
  if (!entry) return null;
  if (entry.region === region) return entry;
  return (entry.alts ?? []).find((a) => a.region === region) ?? null;
}

function toSlot(speciesName, speciesId, entryNumber, regionalForm = null) {
  const spriteId = regionalForm?.formId ?? speciesId;
  const baseName = titleCase(speciesName);
  const name = regionalForm ? `${REGION_PREFIX[regionalForm.region] ?? ''} ${baseName}`.trim() : baseName;
  return {
    id: speciesId,
    key: `n${speciesId}`,
    slug: regionalForm?.apiSlug ?? speciesName,
    name,
    entryNumber,
    ...(regionalForm
      ? {
          formId: regionalForm.formId,
          formSlug: regionalForm.apiSlug,
          region: regionalForm.region,
        }
      : {}),
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`,
    shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${spriteId}.png`,
  };
}

function megaDisplayName(speciesName, apiSlug) {
  const base = titleCase(speciesName);
  if (/-mega-x$|-megax$/.test(apiSlug)) return `Mega ${base} X`;
  if (/-mega-y$|-megay$/.test(apiSlug)) return `Mega ${base} Y`;
  if (/-mega-z$|-megaz$/.test(apiSlug)) return `Mega ${base} Z`;
  return `Mega ${base}`;
}

/**
 * Build HOME Mega Evolution Pokédex slots (93) from form-variants mega map.
 * Dual megas (X/Y/Z) are separate entries; Meowstic / Magearna / Tatsugiri are combined.
 * Entry numbers use Lumiose / Hyperspace dex numbers (as in Z-A / HOME), not 1…93.
 * @param {Record<string, any>} megaMap
 * @param {{ lumiose?: Map<number, number>, hyperspace?: Map<number, number> }} regionalEntries
 */
function buildMegaSlots(megaMap, regionalEntries = {}) {
  const { lumiose, hyperspace } = regionalEntries;
  /** @type {Array<ReturnType<typeof toSlot> & { sortKey: number }>} */
  const slots = [];

  for (const speciesId of Object.keys(megaMap).map(Number)) {
    const entry = megaMap[String(speciesId)];
    if (!entry) continue;
    const speciesName = entry.apiSlug.replace(/-(mega(-[xyz])?|megax|megay|megaz|male-mega|female-mega|.*-mega)$/, '');
    const forms = COMBINED_MEGA_SPECIES.has(speciesId) ? [entry] : [entry, ...(entry.alts ?? [])];
    const lumioseNo = lumiose?.get(speciesId);
    const hyperspaceNo = hyperspace?.get(speciesId);
    const entryNumber = lumioseNo ?? hyperspaceNo ?? speciesId;
    // Lumiose megas first (as in Z-A), then Hyperspace — numbers overlap across dexes.
    const sortKey = lumioseNo != null ? lumioseNo : 1000 + (hyperspaceNo ?? speciesId);

    for (const form of forms) {
      const spriteId = form.formId;
      slots.push({
        id: speciesId,
        key: `n${speciesId}-${form.apiSlug}`,
        slug: form.apiSlug,
        name: megaDisplayName(speciesName, form.apiSlug),
        entryNumber,
        formId: form.formId,
        formSlug: form.apiSlug,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`,
        shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${spriteId}.png`,
        sortKey,
      });
    }
  }

  return slots
    .sort((a, b) => a.sortKey - b.sortKey || a.id - b.id || a.slug.localeCompare(b.slug))
    .map(({ sortKey: _sortKey, ...slot }) => slot);
}

function boxify(slots, gameId) {
  const boxes = [];
  for (let i = 0; i < slots.length; i += BOX_SIZE) {
    const slice = slots.slice(i, i + BOX_SIZE);
    const boxIndex = boxes.length + 1;
    const first = slice[0].entryNumber;
    const last = slice.at(-1).entryNumber;
    boxes.push({
      id: `${gameId}-box-${boxIndex}`,
      title: `Box ${boxIndex}`,
      rangeLabel: `#${String(first).padStart(3, '0')}–#${String(last).padStart(3, '0')}`,
      slots: slice,
    });
  }
  return boxes;
}

async function loadDex(slug) {
  const dex = await fetchJson(`https://pokeapi.co/api/v2/pokedex/${slug}/`);
  return dex.pokemon_entries
    .map((entry) => ({
      id: speciesIdFromUrl(entry.pokemon_species.url),
      name: entry.pokemon_species.name,
      entryNumber: entry.entry_number,
    }))
    .sort((a, b) => a.entryNumber - b.entryNumber || a.id - b.id);
}

/** @returns {Promise<Set<number>>} */
async function loadGoReleasedIds() {
  const data = await fetchJson(POGO_RELEASED_URL);
  return new Set(
    Object.keys(data)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0),
  );
}

async function main() {
  let regionalMap = {};
  let megaMap = {};
  try {
    const fv = JSON.parse(readFileSync(formVariantsPath, 'utf8'));
    regionalMap = fv.regional ?? {};
    megaMap = fv.mega ?? {};
  } catch {
    console.warn('form-variants.json missing — run generate-form-variants first');
  }

  const games = [];
  /** @type {Map<string, Map<number, number>>} */
  const entryByGame = new Map();

  for (const game of GAMES) {
    console.log(`Building ${game.id}…`);
    try {
      /** @type {ReturnType<typeof toSlot>[]} */
      let slots;

      if (game.source === 'mega') {
        slots = buildMegaSlots(megaMap, {
          lumiose: entryByGame.get('za-lumiose'),
          hyperspace: entryByGame.get('za-hyperspace'),
        });
        if (slots.length === 0) {
          console.warn(`  skip ${game.id}: no mega forms in form-variants`);
          continue;
        }
      } else {
        const slug = game.pokedexSlugs[0];
        const region = REGION_BY_POKEDEX[slug];
        const exclude = new Set(game.excludeIds ?? []);
        const fullSpecies = await loadDex(slug);
        // Full map (pre-exclude) so Mega dex can use in-game Lumiose/Hyperspace numbers
        // even for species HOME omits from those living dexes (e.g. Mewtwo).
        entryByGame.set(game.id, new Map(fullSpecies.map((s) => [s.id, s.entryNumber])));
        let species = exclude.size ? fullSpecies.filter((s) => !exclude.has(s.id)) : fullSpecies;
        if (species.length === 0) {
          console.warn(`  skip ${game.id}: empty dex`);
          continue;
        }
        // Keep each game's own Pokédex entry numbers (do not renumber after excludes).
        let regionalHits = 0;
        slots = species.map((s) => {
          const form = resolveRegionalForm(regionalMap, s.id, region);
          if (form) regionalHits += 1;
          return toSlot(s.name, s.id, s.entryNumber, form);
        });
        if (regionalHits) console.log(`  (${regionalHits} regional forms)`);

        if (game.source === 'go') {
          const released = await loadGoReleasedIds();
          let unavailable = 0;
          slots = slots.map((slot) => {
            if (released.has(slot.id)) return slot;
            unavailable += 1;
            return { ...slot, available: false };
          });
          console.log(`  (${unavailable} not yet in Pokémon GO)`);
        }
      }

      games.push({
        id: game.id,
        name: game.name,
        short: game.short,
        group: game.group,
        groupShort: game.groupShort,
        kind: game.kind,
        logo: game.logo,
        pokedexSlugs: game.pokedexSlugs,
        total: slots.length,
        boxSize: BOX_SIZE,
        boxes: boxify(slots, game.id),
      });
      console.log(`  ${slots.length} Pokémon`);
    } catch (err) {
      console.warn(`  skip ${game.id}:`, err.message);
    }
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        version: 2,
        generatedAt: new Date().toISOString(),
        games,
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${games.length} dexes → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
