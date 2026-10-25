/**
 * Builds mega / gmax / regional form maps from PokéAPI (form ids + showdown slugs).
 * Run: node scripts/generate-form-variants.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/data/form-variants.json");

const REGIONS = ["alola", "galar", "hisui", "paldea"];
const REGION_RE = new RegExp(`-(${REGIONS.join("|")})(?:-|$)`);

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function isMegaName(name) {
  // Includes classic -mega / -mega-x/y, showdown -megax/y, and Z-A -mega-z.
  return /-(mega(-[xyz])?|megax|megay|megaz)$/.test(name);
}

function isGmaxName(name) {
  return name.endsWith("-gmax") || name.endsWith("-gigantamax");
}

function isRegionalName(name) {
  if (name.includes("totem") || name.includes("-cap")) return false;
  return REGION_RE.test(name);
}

function regionalRegion(name) {
  const m = name.match(REGION_RE);
  return m?.[1] ?? null;
}

/** Prefer the "main" regional form when multiple exist (e.g. darmanitan zen). */
function regionalRank(apiSlug) {
  if (apiSlug.endsWith("-standard")) return 0;
  if (apiSlug.endsWith("-combat-breed")) return 0;
  if (apiSlug.endsWith("-zen")) return 2;
  if (/-blaze-breed$|-aqua-breed$/.test(apiSlug)) return 1;
  return 0;
}

/** Showdown dex files use -megax / -megay (no extra hyphen). */
function showdownSlug(pokeApiSlug) {
  return pokeApiSlug.replace(/-mega-x$/, "-megax").replace(/-mega-y$/, "-megay");
}

function speciesIdFromUrl(url) {
  return Number(url.split("/").filter(Boolean).pop());
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  console.log("Fetching Pokémon list…");
  const list = await fetchJson("https://pokeapi.co/api/v2/pokemon?limit=2000");
  const candidates = list.results.filter(
    (p) => isMegaName(p.name) || isGmaxName(p.name) || isRegionalName(p.name),
  );
  console.log(`Found ${candidates.length} mega/gmax/regional forms`);

  /** @type {Record<string, any>} */
  const mega = {};
  /** @type {Record<string, any>} */
  const gmax = {};
  /** @type {Record<string, Array<{ formId: number, slug: string, apiSlug: string, region: string }>>} */
  const regionalById = {};

  await mapWithConcurrency(candidates, 8, async (item) => {
    const poke = await fetchJson(item.url);
    const nationalId = speciesIdFromUrl(poke.species.url);
    const key = String(nationalId);
    const formId = poke.id;
    const apiSlug = poke.name;
    const entry = {
      formId,
      slug: showdownSlug(apiSlug),
      apiSlug,
    };

    if (isMegaName(apiSlug)) {
      const existing = mega[key];
      if (!existing) {
        mega[key] = entry;
        return;
      }
      const preferNew =
        (apiSlug.endsWith("-mega") && !existing.apiSlug.endsWith("-mega")) ||
        (/mega-x$|megax$/.test(apiSlug) && /mega-y$|megay$/.test(existing.apiSlug));
      if (preferNew) {
        mega[key] = {
          ...entry,
          alts: [
            {
              formId: existing.formId,
              slug: existing.slug,
              apiSlug: existing.apiSlug,
            },
            ...(existing.alts ?? []),
          ],
        };
      } else {
        existing.alts = [...(existing.alts ?? []), entry];
      }
      return;
    }

    if (isGmaxName(apiSlug)) {
      gmax[key] = entry;
      return;
    }

    const region = regionalRegion(apiSlug);
    if (!region) return;
    if (!regionalById[key]) regionalById[key] = [];
    regionalById[key].push({ ...entry, region });
  });

  /** @type {Record<string, any>} */
  const regional = {};
  for (const [id, forms] of Object.entries(regionalById)) {
    // Best form per region
    const byRegion = new Map();
    for (const form of forms) {
      const prev = byRegion.get(form.region);
      if (!prev || regionalRank(form.apiSlug) < regionalRank(prev.apiSlug)) {
        byRegion.set(form.region, form);
      }
    }
    const ordered = REGIONS.map((r) => byRegion.get(r)).filter(Boolean);
    const primary = ordered[0];
    if (!primary) continue;
    regional[id] = {
      formId: primary.formId,
      slug: primary.slug,
      apiSlug: primary.apiSlug,
      region: primary.region,
      alts: ordered.slice(1).map((a) => ({
        formId: a.formId,
        slug: a.slug,
        apiSlug: a.apiSlug,
        region: a.region,
      })),
    };
  }

  const payload = {
    version: 2,
    generatedAt: new Date().toISOString(),
    megaCount: Object.keys(mega).length,
    gmaxCount: Object.keys(gmax).length,
    regionalCount: Object.keys(regional).length,
    mega,
    gmax,
    regional,
  };

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `Wrote ${outPath} (${payload.megaCount} mega, ${payload.gmaxCount} gmax, ${payload.regionalCount} regional)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
