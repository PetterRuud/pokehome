/**
 * Builds mega / gmax form maps from PokéAPI (form ids + showdown slugs).
 * Run: node scripts/generate-form-variants.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '../src/data/form-variants.json')

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.json()
}

function isMegaName(name) {
  // PokeAPI: venusaur-mega, charizard-mega-x, charizard-mega-y
  return /-(mega(-[xy])?|megax|megay)$/.test(name)
}

function isGmaxName(name) {
  return name.endsWith('-gmax') || name.endsWith('-gigantamax')
}

/** Showdown dex files use -megax / -megay (no extra hyphen). */
function showdownSlug(pokeApiSlug) {
  return pokeApiSlug
    .replace(/-mega-x$/, '-megax')
    .replace(/-mega-y$/, '-megay')
}

function speciesIdFromUrl(url) {
  return Number(url.split('/').filter(Boolean).pop())
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )
  return results
}

async function main() {
  console.log('Fetching Pokémon list…')
  const list = await fetchJson('https://pokeapi.co/api/v2/pokemon?limit=2000')
  const candidates = list.results.filter(
    (p) => isMegaName(p.name) || isGmaxName(p.name),
  )
  console.log(`Found ${candidates.length} mega/gmax forms`)

  const mega = {}
  const gmax = {}

  await mapWithConcurrency(candidates, 8, async (item) => {
    const poke = await fetchJson(item.url)
    const nationalId = speciesIdFromUrl(poke.species.url)
    const formId = poke.id
    const apiSlug = poke.name
    const entry = {
      formId,
      slug: showdownSlug(apiSlug),
      apiSlug,
    }

    if (isMegaName(apiSlug)) {
      const existing = mega[nationalId]
      if (!existing) {
        mega[nationalId] = entry
        return
      }
      const preferNew =
        (apiSlug.endsWith('-mega') && !existing.apiSlug.endsWith('-mega')) ||
        (/mega-x$|megax$/.test(apiSlug) && /mega-y$|megay$/.test(existing.apiSlug))
      if (preferNew) {
        const prev = {
          formId: existing.formId,
          slug: existing.slug,
          apiSlug: existing.apiSlug,
        }
        mega[nationalId] = {
          ...entry,
          alts: [...(existing.alts ?? []), prev],
        }
      } else {
        existing.alts = [...(existing.alts ?? []), entry]
      }
    } else {
      gmax[nationalId] = entry
    }
  })

  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    megaCount: Object.keys(mega).length,
    gmaxCount: Object.keys(gmax).length,
    mega,
    gmax,
  }

  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n')
  console.log(
    `Wrote ${outPath} (${payload.megaCount} mega, ${payload.gmaxCount} gmax)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
