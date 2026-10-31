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

function titleCaseSlug(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type PokeApiPokemon = {
  types: Array<{ slot: number; type: { name: string } }>;
  moves: Array<{
    move: { name: string };
    version_group_details: Array<{
      level_learned_at: number;
      move_learn_method: { name: string };
    }>;
  }>;
};

async function fetchPokemon(id: string): Promise<PokeApiPokemon> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`);
  if (!res.ok) throw new Error('Not found');
  return res.json() as Promise<PokeApiPokemon>;
}

async function fetchMoveType(slug: string): Promise<string> {
  const cacheKey = `move-type:${slug}`;
  const cached = await readCache(cacheKey);
  if (cached) return cached;
  const res = await fetch(`https://pokeapi.co/api/v2/move/${slug}/`);
  if (!res.ok) return 'normal';
  const move = (await res.json()) as { type: { name: string } };
  const type = move.type.name;
  await writeCache(cacheKey, type);
  return type;
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export type MovePoolEntry = {
  slug: string;
  name: string;
  type: string;
  methods: string[];
  level?: number;
};

export type MovePool = {
  id: number;
  moves: MovePoolEntry[];
};

export const getPokemonSummary = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const cacheKey = `summary:v2:${data.id}`;
    const cached = await readCache(cacheKey);
    if (cached) return JSON.parse(cached);

    const [species, pokemon] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${data.id}/`).then(async (r) => {
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
      }),
      fetchPokemon(data.id),
    ]);

    const genus = species.genera.find((g) => g.language.name === 'en')?.genus ?? '';
    const flavor =
      species.flavor_text_entries.find((f) => f.language.name === 'en')?.flavor_text.replace(/\f|\n|\r/g, ' ') ?? '';
    const types = [...pokemon.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name);

    const summary = {
      id: species.id,
      slug: species.name,
      name: titleCaseSlug(species.name),
      genus,
      flavor,
      types,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.id}.png`,
    };

    await writeCache(cacheKey, JSON.stringify(summary));
    return summary;
  });

export const getPokemonMovePool = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<MovePool> => {
    const cacheKey = `moves:v1:${data.id}`;
    const cached = await readCache(cacheKey);
    if (cached) return JSON.parse(cached) as MovePool;

    const pokemon = await fetchPokemon(data.id);
    const aggregated = pokemon.moves.map((entry) => {
      const methods = new Set<string>();
      let level: number | undefined;
      for (const detail of entry.version_group_details) {
        methods.add(detail.move_learn_method.name);
        if (detail.move_learn_method.name === 'level-up' && detail.level_learned_at > 0) {
          level = level == null ? detail.level_learned_at : Math.min(level, detail.level_learned_at);
        }
      }
      return {
        slug: entry.move.name,
        name: titleCaseSlug(entry.move.name),
        methods: [...methods].sort(),
        level,
      };
    });

    const types = await mapPool(aggregated, 8, (move) => fetchMoveType(move.slug));
    const moves: MovePoolEntry[] = aggregated
      .map((move, i) => ({ ...move, type: types[i] ?? 'normal' }))
      .sort((a, b) => {
        const aLevel = a.methods.includes('level-up') ? (a.level ?? 999) : 1000;
        const bLevel = b.methods.includes('level-up') ? (b.level ?? 999) : 1000;
        if (aLevel !== bLevel) return aLevel - bLevel;
        return a.name.localeCompare(b.name);
      });

    const pool: MovePool = { id: Number(data.id), moves };
    await writeCache(cacheKey, JSON.stringify(pool));
    return pool;
  });
