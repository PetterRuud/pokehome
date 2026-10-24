/**
 * Generates HOME-style game + DLC dex boxes from PokéAPI.
 * Each main game and DLC is a separate entry (matches HOME's National Pokédexes page).
 * Run: node scripts/generate-game-dexes.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/data/games.json");
const BOX_SIZE = 30;

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
 * }} GameDef
 */

/** @type {GameDef[]} */
const GAMES = [
  {
    id: "lgpe",
    name: "Let's Go Pikachu / Eevee",
    short: "LGPE",
    group: "Let's Go",
    groupShort: "LGPE",
    kind: "main",
    logo: "lgpe",
    pokedexSlugs: ["letsgo-kanto"],
  },
  {
    id: "swsh-galar",
    name: "Galar Pokédex",
    short: "Galar",
    group: "Sword / Shield",
    groupShort: "SwSh",
    kind: "main",
    logo: "swsh",
    pokedexSlugs: ["galar"],
  },
  {
    id: "swsh-ioa",
    name: "Isle of Armor",
    short: "IoA",
    group: "Sword / Shield",
    groupShort: "SwSh",
    kind: "dlc",
    logo: "swsh",
    pokedexSlugs: ["isle-of-armor"],
  },
  {
    id: "swsh-ct",
    name: "Crown Tundra",
    short: "CT",
    group: "Sword / Shield",
    groupShort: "SwSh",
    kind: "dlc",
    logo: "swsh",
    pokedexSlugs: ["crown-tundra"],
  },
  {
    id: "bdsp",
    name: "Brilliant Diamond / Shining Pearl",
    short: "BDSP",
    group: "BDSP",
    groupShort: "BDSP",
    kind: "main",
    logo: "bdsp",
    pokedexSlugs: ["original-sinnoh"],
  },
  {
    id: "pla",
    name: "Legends: Arceus",
    short: "PLA",
    group: "Legends: Arceus",
    groupShort: "PLA",
    kind: "main",
    logo: "pla",
    pokedexSlugs: ["hisui"],
  },
  {
    id: "sv-paldea",
    name: "Paldea Pokédex",
    short: "Paldea",
    group: "Scarlet / Violet",
    groupShort: "SV",
    kind: "main",
    logo: "sv",
    pokedexSlugs: ["paldea"],
  },
  {
    id: "sv-kitakami",
    name: "Kitakami Pokédex",
    short: "Kitakami",
    group: "Scarlet / Violet",
    groupShort: "SV",
    kind: "dlc",
    logo: "sv",
    pokedexSlugs: ["kitakami"],
  },
  {
    id: "sv-blueberry",
    name: "Blueberry Pokédex",
    short: "Blueberry",
    group: "Scarlet / Violet",
    groupShort: "SV",
    kind: "dlc",
    logo: "sv",
    pokedexSlugs: ["blueberry"],
  },
  {
    id: "za-lumiose",
    name: "Lumiose Pokédex",
    short: "Lumiose",
    group: "Legends: Z-A",
    groupShort: "Z-A",
    kind: "main",
    logo: "za",
    pokedexSlugs: ["lumiose-city"],
  },
  {
    id: "za-hyperspace",
    name: "Hyperspace Pokédex",
    short: "Hyperspace",
    group: "Legends: Z-A",
    groupShort: "Z-A",
    kind: "dlc",
    logo: "za",
    pokedexSlugs: ["hyperspace"],
  },
  {
    id: "za-mega",
    name: "Mega Evolution Pokédex",
    short: "Mega",
    group: "Legends: Z-A",
    groupShort: "Z-A",
    kind: "special",
    logo: "mega",
    // PokéAPI "champions" lists mega-capable species used as Mega dex proxy.
    pokedexSlugs: ["champions"],
  },
  {
    id: "go",
    name: "Pokémon GO",
    short: "GO",
    group: "Pokémon GO",
    groupShort: "GO",
    kind: "special",
    logo: "go",
    // HOME's GO National Dex tracks origin-from-GO; species pool ≈ national.
    pokedexSlugs: ["national"],
  },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function speciesIdFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

function toSlot(speciesName, speciesId, entryNumber) {
  return {
    id: speciesId,
    key: `n${speciesId}`,
    slug: speciesName,
    name: titleCase(speciesName),
    entryNumber,
    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`,
    shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${speciesId}.png`,
  };
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
      rangeLabel: `#${String(first).padStart(3, "0")}–#${String(last).padStart(3, "0")}`,
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

async function main() {
  const games = [];

  for (const game of GAMES) {
    const slug = game.pokedexSlugs[0];
    console.log(`Fetching ${game.id} (${slug})…`);
    try {
      const species = await loadDex(slug);
      if (species.length === 0) {
        console.warn(`  skip ${game.id}: empty dex`);
        continue;
      }
      const slots = species.map((s) => toSlot(s.name, s.id, s.entryNumber));
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
