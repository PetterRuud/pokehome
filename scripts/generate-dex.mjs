/**
 * Generates a national living-dex layout (30 slots per box) from PokéAPI,
 * then appends special form boxes (Unown, Trims & Flowers, Vivillon, Alcremie).
 * Run: node scripts/generate-dex.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFormBoxes } from './form-boxes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '../src/data/national-dex.json');

const LIMIT = 1025;
const BOX_SIZE = 30;

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

async function main() {
  console.log('Fetching species list…');
  const list = await fetchJson(`https://pokeapi.co/api/v2/pokemon-species?limit=${LIMIT}`);

  const entries = [];
  for (const item of list.results) {
    const id = Number(item.url.split('/').filter(Boolean).pop());
    entries.push({
      id,
      key: `n${id}`,
      slug: item.name,
      name: titleCase(item.name),
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
      shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
    });
  }
  entries.sort((a, b) => a.id - b.id);

  const boxes = [];
  for (let i = 0; i < entries.length; i += BOX_SIZE) {
    const slice = entries.slice(i, i + BOX_SIZE);
    const boxIndex = boxes.length + 1;
    boxes.push({
      id: `box-${boxIndex}`,
      title: `Box ${boxIndex}`,
      rangeLabel: `#${String(slice[0].id).padStart(4, '0')}–#${String(slice.at(-1).id).padStart(4, '0')}`,
      slots: slice,
    });
  }

  const { boxes: formBoxes, formSlotCount } = buildFormBoxes(boxes.length + 1);
  boxes.push(...formBoxes);

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        version: 2,
        generatedAt: new Date().toISOString(),
        total: entries.length + formSlotCount,
        speciesTotal: entries.length,
        formSlotCount,
        boxSize: BOX_SIZE,
        boxes,
      },
      null,
      2,
    ),
  );
  console.log(
    `Wrote ${boxes.length} boxes (${entries.length} species + ${formSlotCount} forms) → ${outPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
