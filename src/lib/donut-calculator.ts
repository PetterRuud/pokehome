import { HYPER_BERRY_IDS, hyperBerryFlavorScore, type HyperBerryId } from '@/lib/berries';
import { trainerTipsById, type TipBerry, type TipRecipe } from '@/data/trainer-tips';

/** Min total flavor score for each donut ★ (Bulbapedia / Game8). */
export const DONUT_STAR_FLAVOR: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 120,
  2: 240,
  3: 350,
  4: 700,
  5: 960,
};

/** Max berry slots with best butter. */
export const DONUT_MAX_SLOTS = 8;

export type DonutStar = 1 | 2 | 3 | 4 | 5;

export type StarDonutSuggestion = {
  stars: DonutStar;
  targetFlavor: number;
  flavor: number;
  canMake: boolean;
  /** Aggregated picks (hyper berries only). */
  ingredients: TipBerry[];
};

export type MixGoal = 'stars' | 'shiny' | 'farm' | 'cheap' | 'early' | 'mid' | 'late';

export type TipMixSuggestion = {
  goal: MixGoal;
  /** Tip recipe note or generated blurb. */
  note?: string;
  canMake: boolean;
  missing: TipBerry[];
  ingredients: TipBerry[];
};

/** Hyper berries that can stand in for each other in portal recipes. */
const HYPER_SUBSTITUTES: Record<string, string[]> = {
  coba: ['rindo'],
  rindo: ['coba'],
};

/** Full Mega Dimension Hyper Berry inventory list, sorted by name. */
export function getAllHyperBerryIds(): readonly string[] {
  return [...HYPER_BERRY_IDS].sort((a, b) => a.localeCompare(b));
}

export type DonutCheckResult = {
  canMake: boolean;
  /** Required berries still short after applying inventory (+ substitutes). */
  missing: TipBerry[];
  /** Required (non-optional) totals for the recipe. */
  required: TipBerry[];
};

export function getSpecialDonutRecipes(): TipRecipe[] {
  const tips = trainerTipsById.za;
  if (!tips) return [];
  for (const section of tips.sections) {
    for (const block of section.blocks) {
      if (block.type === 'recipes' && block.title === 'Special donuts (legendary portals)') {
        return block.recipes.filter((r) => Boolean(r.label));
      }
    }
  }
  return [];
}

function takeFromPool(pool: Record<string, number>, id: string, need: number): number {
  const have = pool[id] ?? 0;
  const used = Math.min(have, need);
  pool[id] = have - used;
  return need - used;
}

/** Spend inventory toward a required berry, allowing known substitutes. */
function satisfyNeed(pool: Record<string, number>, id: string, need: number): number {
  let remaining = takeFromPool(pool, id, need);
  if (remaining <= 0) return 0;
  for (const alt of HYPER_SUBSTITUTES[id] ?? []) {
    remaining = takeFromPool(pool, alt, remaining);
    if (remaining <= 0) return 0;
  }
  return remaining;
}

/** How many of this berry you can apply, counting known substitutes. */
export function availableIncludingSubstitutes(inventory: Record<string, number>, id: string): number {
  let n = Math.max(0, inventory[id] ?? 0);
  for (const alt of HYPER_SUBSTITUTES[id] ?? []) {
    n += Math.max(0, inventory[alt] ?? 0);
  }
  return n;
}

export function checkDonutRecipe(inventory: Record<string, number>, recipe: TipRecipe): DonutCheckResult {
  const pool: Record<string, number> = {};
  for (const [id, n] of Object.entries(inventory)) {
    pool[id] = Math.max(0, Math.floor(n) || 0);
  }

  const requiredMap = new Map<string, number>();
  for (const berry of recipe.ingredients) {
    if (berry.optional) continue;
    requiredMap.set(berry.id, (requiredMap.get(berry.id) ?? 0) + berry.count);
  }

  const required: TipBerry[] = [...requiredMap.entries()].map(([id, count]) => ({
    id,
    count,
    hyper: true,
  }));

  const missing: TipBerry[] = [];
  for (const berry of required) {
    const short = satisfyNeed(pool, berry.id, berry.count);
    if (short > 0) missing.push({ id: berry.id, count: short, hyper: true });
  }

  return { canMake: missing.length === 0, missing, required };
}

/** Short label for selects (before ·). */
export function donutShortLabel(recipe: TipRecipe): string {
  const label = recipe.label ?? 'Donut';
  const cut = label.indexOf(' · ');
  return cut >= 0 ? label.slice(0, cut) : label;
}

/** Special portal donut bag art (vendored into `public/donuts`). */
export function donutSpriteUrl(donutId: string): string {
  return `/donuts/${donutId}.webp`;
}

function maxFlavorAmong(pool: Record<string, number>, ids: readonly string[]): number {
  let max = 0;
  for (const id of ids) {
    if ((pool[id] ?? 0) <= 0) continue;
    max = Math.max(max, hyperBerryFlavorScore(id));
  }
  return max;
}

/**
 * Suggest a berry mix for a target donut ★ from stash inventory.
 * Prefers berries you own the most of, while still reaching the flavor threshold
 * within {@link DONUT_MAX_SLOTS} slots when possible.
 */
export function suggestDonutForStars(
  inventory: Record<string, number>,
  stars: DonutStar,
  maxSlots: number = DONUT_MAX_SLOTS,
): StarDonutSuggestion {
  const targetFlavor = DONUT_STAR_FLAVOR[stars];
  const pool: Record<string, number> = {};
  for (const id of HYPER_BERRY_IDS) {
    const n = Math.max(0, Math.floor(inventory[id] ?? 0) || 0);
    if (n > 0) pool[id] = n;
  }

  const picks: HyperBerryId[] = [];
  let flavor = 0;

  while (picks.length < maxSlots && flavor < targetFlavor) {
    const available = HYPER_BERRY_IDS.filter((id) => (pool[id] ?? 0) > 0);
    if (available.length === 0) break;

    const slotsLeft = maxSlots - picks.length;
    const need = targetFlavor - flavor;
    const maxFlavor = maxFlavorAmong(pool, available);

    const byCount = [...available].sort((a, b) => {
      const countDiff = (pool[b] ?? 0) - (pool[a] ?? 0);
      if (countDiff !== 0) return countDiff;
      return hyperBerryFlavorScore(b) - hyperBerryFlavorScore(a);
    });

    let chosen =
      byCount.find((id) => {
        const afterNeed = need - hyperBerryFlavorScore(id);
        if (afterNeed <= 0) return true;
        const afterSlots = slotsLeft - 1;
        if (afterSlots <= 0) return false;
        const nextPool = { ...pool, [id]: (pool[id] ?? 0) - 1 };
        const maxAfter = maxFlavorAmong(nextPool, available);
        return afterSlots * maxAfter >= afterNeed;
      }) ?? null;

    // Can't stay "safe" with abundant berries — take highest flavor left.
    if (!chosen) {
      chosen = [...available].sort(
        (a, b) => hyperBerryFlavorScore(b) - hyperBerryFlavorScore(a) || (pool[b] ?? 0) - (pool[a] ?? 0),
      )[0]!;
    }

    // Still impossible even with best remaining density.
    if (maxFlavor * slotsLeft < need && hyperBerryFlavorScore(chosen) < maxFlavor) {
      chosen = [...available].sort((a, b) => hyperBerryFlavorScore(b) - hyperBerryFlavorScore(a))[0]!;
    }

    picks.push(chosen);
    pool[chosen] = (pool[chosen] ?? 0) - 1;
    flavor += hyperBerryFlavorScore(chosen);
  }

  const counts = new Map<string, number>();
  for (const id of picks) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const ingredients: TipBerry[] = [...counts.entries()]
    .map(([id, count]) => ({ id, count, hyper: true as const }))
    .sort(
      (a, b) =>
        b.count - a.count || hyperBerryFlavorScore(b.id) - hyperBerryFlavorScore(a.id) || a.id.localeCompare(b.id),
    );

  return {
    stars,
    targetFlavor,
    flavor,
    canMake: flavor >= targetFlavor,
    ingredients,
  };
}

function recipesFromTips(sectionTitle: string, blockTitle: string): TipRecipe[] {
  const tips = trainerTipsById.za;
  if (!tips) return [];
  for (const section of tips.sections) {
    if (section.title !== sectionTitle) continue;
    for (const block of section.blocks) {
      if (block.type === 'recipes' && block.title === blockTitle) {
        return block.recipes;
      }
    }
  }
  return [];
}

function stageFromNote(note?: string): 'early' | 'mid' | 'late' | null {
  if (!note) return null;
  const head = note.split('·')[0]?.trim().toLowerCase() ?? '';
  if (head.startsWith('early')) return 'early';
  if (head.startsWith('mid')) return 'mid';
  if (head.startsWith('late')) return 'late';
  return null;
}

/** Tip recipes for shiny / farm / cheap / story-stage goals. */
export function getTipRecipesForGoal(goal: Exclude<MixGoal, 'stars'>): TipRecipe[] {
  switch (goal) {
    case 'shiny':
      return recipesFromTips('Shiny & Alpha hunting', 'Sweet donuts');
    case 'farm':
      return recipesFromTips('Item & berry farming', 'Sour donuts');
    case 'cheap':
      return recipesFromTips('Item & berry farming', 'Cheap berry-farm donut');
    case 'early':
    case 'mid':
    case 'late':
      return recipesFromTips('Extra story donuts', 'More mixes by stage').filter((r) => stageFromNote(r.note) === goal);
  }
}

/**
 * How well a recipe fits the stash: uses berries you have a lot of,
 * and is fully craftable when possible.
 */
function tipRecipeFit(
  inventory: Record<string, number>,
  recipe: TipRecipe,
): { canMake: boolean; missingCount: number; abundance: number; required: TipBerry[] } {
  const check = checkDonutRecipe(inventory, recipe);
  const missingCount = check.missing.reduce((n, b) => n + b.count, 0);
  let abundance = 0;
  for (const berry of check.required) {
    const have = availableIncludingSubstitutes(inventory, berry.id);
    abundance += have * Math.min(have, berry.count);
  }
  return {
    canMake: check.canMake,
    missingCount,
    abundance,
    required: check.required,
  };
}

/**
 * Pick the best tip recipe for a goal from the stash.
 * Prefers craftable mixes that spend berries you have the most of.
 */
export function suggestTipMix(
  inventory: Record<string, number>,
  goal: Exclude<MixGoal, 'stars'>,
): TipMixSuggestion | null {
  const recipes = getTipRecipesForGoal(goal);
  if (recipes.length === 0) return null;

  let best: {
    recipe: TipRecipe;
    fit: ReturnType<typeof tipRecipeFit>;
  } | null = null;

  for (const recipe of recipes) {
    const fit = tipRecipeFit(inventory, recipe);
    if (!best) {
      best = { recipe, fit };
      continue;
    }
    const a = fit;
    const b = best.fit;
    // Craftable first, then fewest missing, then highest abundance (use what you have most of).
    if (a.canMake !== b.canMake) {
      if (a.canMake) best = { recipe, fit };
      continue;
    }
    if (a.missingCount !== b.missingCount) {
      if (a.missingCount < b.missingCount) best = { recipe, fit };
      continue;
    }
    if (a.abundance > b.abundance) best = { recipe, fit };
  }

  if (!best) return null;
  const check = checkDonutRecipe(inventory, best.recipe);
  return {
    goal,
    note: best.recipe.note ?? best.recipe.label,
    canMake: check.canMake,
    missing: check.missing,
    ingredients: check.required,
  };
}
