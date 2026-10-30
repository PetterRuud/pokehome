import {
  canGmax,
  canMega,
  canRegional,
  gmaxSpeciesCount,
  megaSpeciesCount,
  regionalSpeciesCount,
} from '@/lib/form-variants';
import { toPercent } from '@/lib/dex-stats';
import type { DexBox, DexSlot, FormView } from '@/lib/types';

export type FormDimension = 'shiny' | 'alpha' | 'mega' | 'gmax' | 'regional';

export type FormProgress = {
  id: FormDimension;
  label: string;
  done: number;
  total: number;
  percent: number;
  missing: number;
};

export type FormHole = {
  dimension: FormDimension;
  slot: DexSlot;
};

function availableSlots(boxes: DexBox[]): DexSlot[] {
  const out: DexSlot[] = [];
  for (const box of boxes) {
    for (const slot of box.slots) {
      if (slot.available === false) continue;
      out.push(slot);
    }
  }
  return out;
}

function countMarked(
  slots: DexSlot[],
  flagByKey: Record<string, boolean> | undefined,
  eligible?: (id: number) => boolean,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const slot of slots) {
    if (eligible && !eligible(slot.id)) continue;
    total += 1;
    if (flagByKey?.[slot.key]) done += 1;
  }
  return { done, total };
}

export function formProgressList(
  boxes: DexBox[],
  flags: {
    shinyByKey?: Record<string, boolean>;
    alphaByKey?: Record<string, boolean>;
    megaByKey?: Record<string, boolean>;
    gmaxByKey?: Record<string, boolean>;
    regionalByKey?: Record<string, boolean>;
  },
): FormProgress[] {
  const slots = availableSlots(boxes);
  const nationalTotal = slots.length;

  const shiny = countMarked(slots, flags.shinyByKey);
  const alpha = countMarked(slots, flags.alphaByKey);
  const mega = countMarked(slots, flags.megaByKey, canMega);
  const gmax = countMarked(slots, flags.gmaxByKey, canGmax);
  const regional = countMarked(slots, flags.regionalByKey, canRegional);

  // Prefer catalog counts for variant totals when available (authoritative eligibility size).
  const megaTotal = Math.max(mega.total, megaSpeciesCount());
  const gmaxTotal = Math.max(gmax.total, gmaxSpeciesCount());
  const regionalTotal = Math.max(regional.total, regionalSpeciesCount());

  const rows: FormProgress[] = [
    {
      id: 'shiny',
      label: 'Shiny',
      done: shiny.done,
      total: nationalTotal,
      percent: toPercent(shiny.done, nationalTotal),
      missing: Math.max(0, nationalTotal - shiny.done),
    },
    {
      id: 'alpha',
      label: 'Alpha',
      done: alpha.done,
      total: nationalTotal,
      percent: toPercent(alpha.done, nationalTotal),
      missing: Math.max(0, nationalTotal - alpha.done),
    },
    {
      id: 'mega',
      label: 'Mega',
      done: mega.done,
      total: megaTotal,
      percent: toPercent(mega.done, megaTotal),
      missing: Math.max(0, megaTotal - mega.done),
    },
    {
      id: 'gmax',
      label: 'Gmax',
      done: gmax.done,
      total: gmaxTotal,
      percent: toPercent(gmax.done, gmaxTotal),
      missing: Math.max(0, gmaxTotal - gmax.done),
    },
    {
      id: 'regional',
      label: 'Regional',
      done: regional.done,
      total: regionalTotal,
      percent: toPercent(regional.done, regionalTotal),
      missing: Math.max(0, regionalTotal - regional.done),
    },
  ];

  return rows;
}

function eligibleFor(dimension: FormDimension): ((id: number) => boolean) | undefined {
  if (dimension === 'mega') return canMega;
  if (dimension === 'gmax') return canGmax;
  if (dimension === 'regional') return canRegional;
  return undefined;
}

function flagMapFor(
  dimension: FormDimension,
  flags: {
    shinyByKey?: Record<string, boolean>;
    alphaByKey?: Record<string, boolean>;
    megaByKey?: Record<string, boolean>;
    gmaxByKey?: Record<string, boolean>;
    regionalByKey?: Record<string, boolean>;
  },
): Record<string, boolean> | undefined {
  switch (dimension) {
    case 'shiny':
      return flags.shinyByKey;
    case 'alpha':
      return flags.alphaByKey;
    case 'mega':
      return flags.megaByKey;
    case 'gmax':
      return flags.gmaxByKey;
    case 'regional':
      return flags.regionalByKey;
  }
}

/** First N missing eligible slots in national order for a form dimension. */
export function biggestHoles(
  boxes: DexBox[],
  dimension: FormDimension,
  flags: {
    shinyByKey?: Record<string, boolean>;
    alphaByKey?: Record<string, boolean>;
    megaByKey?: Record<string, boolean>;
    gmaxByKey?: Record<string, boolean>;
    regionalByKey?: Record<string, boolean>;
  },
  limit = 6,
): FormHole[] {
  const slots = availableSlots(boxes);
  const eligible = eligibleFor(dimension);
  const map = flagMapFor(dimension, flags);
  const holes: FormHole[] = [];

  for (const slot of slots) {
    if (eligible && !eligible(slot.id)) continue;
    if (map?.[slot.key]) continue;
    holes.push({ dimension, slot });
    if (holes.length >= limit) break;
  }

  return holes;
}

/** Spread holes across dimensions until `limit` total (round-robin by missing priority). */
export function biggestHolesAcross(
  boxes: DexBox[],
  flags: {
    shinyByKey?: Record<string, boolean>;
    alphaByKey?: Record<string, boolean>;
    megaByKey?: Record<string, boolean>;
    gmaxByKey?: Record<string, boolean>;
    regionalByKey?: Record<string, boolean>;
  },
  limit = 10,
): FormHole[] {
  const progress = formProgressList(boxes, flags);
  const ordered = [...progress].sort((a, b) => b.missing - a.missing || a.id.localeCompare(b.id));
  const perDim = Math.max(2, Math.ceil(limit / Math.max(1, ordered.filter((p) => p.missing > 0).length)));
  const seen = new Set<string>();
  const out: FormHole[] = [];

  for (const row of ordered) {
    if (row.missing <= 0) continue;
    for (const hole of biggestHoles(boxes, row.id, flags, perDim)) {
      const key = `${hole.dimension}:${hole.slot.key}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(hole);
      if (out.length >= limit) return out;
    }
  }

  return out;
}

export function formViewForDimension(dimension: FormDimension): FormView {
  return dimension;
}
