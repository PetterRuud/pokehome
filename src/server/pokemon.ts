import { createServerFn } from '@tanstack/react-start';
import { getWorkerEnv } from '@/lib/cloudflare';
import { fetchEvolutionChainBySpecies } from '@/lib/evolution';

const memoryCache = new Map<string, { expires: number; value: string }>();

function memoryGet(key: string): string | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value;
}

function memorySet(key: string, value: string, ttlMs = 1000 * 60 * 60 * 24) {
  memoryCache.set(key, { value, expires: Date.now() + ttlMs });
}

async function readCache(key: string): Promise<string | null> {
  const local = memoryGet(key);
  if (local) return local;
  try {
    const env = await getWorkerEnv();
    const fromKv = env?.POKE_CACHE ? await env.POKE_CACHE.get(key) : null;
    if (fromKv) memorySet(key, fromKv);
    return fromKv;
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: string) {
  memorySet(key, value);
  try {
    const env = await getWorkerEnv();
    if (env?.POKE_CACHE) {
      await env.POKE_CACHE.put(key, value, { expirationTtl: 60 * 60 * 24 * 7 });
    }
  } catch {
    // unbound locally
  }
}

export const getEvolutionChain = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const cacheKey = `evo:${data.id}`;
    const cached = await readCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const chain = await fetchEvolutionChainBySpecies(data.id);
    await writeCache(cacheKey, JSON.stringify(chain));
    return chain;
  });

export const getPokemonSummary = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const cacheKey = `species:${data.id}`;
    const cached = await readCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const species = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}/`).then(async (r) => {
      if (!r.ok) throw new Error('Not found');
      return r.json() as Promise<{
        id: number;
        name: string;
        genera: Array<{ genus: string; language: { name: string } }>;
        flavor_text_entries: Array<{
          flavor_text: string;
          language: { name: string };
        }>;
      }>;
    });

    const genus = species.genera.find((g) => g.language.name === 'en')?.genus ?? '';
    const flavor =
      species.flavor_text_entries.find((f) => f.language.name === 'en')?.flavor_text.replace(/\f|\n|\r/g, ' ') ?? '';

    const summary = {
      id: species.id,
      slug: species.name,
      name: species.name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
      genus,
      flavor,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.id}.png`,
    };

    await writeCache(cacheKey, JSON.stringify(summary));
    return summary;
  });
