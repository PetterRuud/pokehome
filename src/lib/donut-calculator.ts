import { HYPER_BERRY_IDS } from "@/lib/berries";
import { trainerTipsById, type TipBerry, type TipRecipe } from "@/data/trainer-tips";

/** Hyper berries that can stand in for each other in portal recipes. */
const HYPER_SUBSTITUTES: Record<string, string[]> = {
  coba: ["rindo"],
  rindo: ["coba"],
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
      if (block.type === "recipes" && block.title === "Special donuts (legendary portals)") {
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
function satisfyNeed(
  pool: Record<string, number>,
  id: string,
  need: number,
): number {
  let remaining = takeFromPool(pool, id, need);
  if (remaining <= 0) return 0;
  for (const alt of HYPER_SUBSTITUTES[id] ?? []) {
    remaining = takeFromPool(pool, alt, remaining);
    if (remaining <= 0) return 0;
  }
  return remaining;
}

/** How many of this berry you can apply, counting known substitutes. */
export function availableIncludingSubstitutes(
  inventory: Record<string, number>,
  id: string,
): number {
  let n = Math.max(0, inventory[id] ?? 0);
  for (const alt of HYPER_SUBSTITUTES[id] ?? []) {
    n += Math.max(0, inventory[alt] ?? 0);
  }
  return n;
}

export function checkDonutRecipe(
  inventory: Record<string, number>,
  recipe: TipRecipe,
): DonutCheckResult {
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
  const label = recipe.label ?? "Donut";
  const cut = label.indexOf(" · ");
  return cut >= 0 ? label.slice(0, cut) : label;
}

/** Special portal donut bag art (vendored into `public/donuts`). */
export function donutSpriteUrl(donutId: string): string {
  return `/donuts/${donutId}.webp`;
}
