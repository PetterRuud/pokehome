import type { DexBox, DexSlot } from '@/lib/types';

function isSlotAvailable(slot: { available?: boolean }) {
  return slot.available !== false;
}

/** Special form boxes (Unown / Vivillon / …) — not part of national progress. */
export function isFormsBox(box: DexBox): boolean {
  return box.kind === 'forms';
}

/** Species living-dex keys are `n{id}`; form-box keys are `f{formId}`. */
export function isSpeciesKey(key: string): boolean {
  return key.startsWith('n');
}

/** Percent of a dex: 0 when empty, 100 only when complete, otherwise 1–99 via floor. */
export function toPercent(caught: number, total: number): number {
  if (total <= 0 || caught <= 0) return 0;
  if (caught >= total) return 100;
  return Math.min(99, Math.max(1, Math.floor((caught / total) * 100)));
}

export function countProgress(
  boxes: DexBox[],
  caughtByKey: Record<string, boolean>,
  opts?: { includeForms?: boolean },
) {
  let total = 0;
  let caught = 0;
  for (const box of boxes) {
    if (!opts?.includeForms && isFormsBox(box)) continue;
    for (const slot of box.slots) {
      if (!isSlotAvailable(slot)) continue;
      total += 1;
      if (caughtByKey[slot.key]) caught += 1;
    }
  }
  return { total, caught, percent: toPercent(caught, total) };
}

export function countGameProgress(boxes: DexBox[], caughtMap: Record<string, boolean> | undefined) {
  return countProgress(boxes, caughtMap ?? {});
}

export function countFlag(flagByKey: Record<string, boolean> | undefined): number {
  if (!flagByKey) return 0;
  return Object.values(flagByKey).filter(Boolean).length;
}

/** Count only national species flags (`n…`), ignoring special form-box marks. */
export function countSpeciesFlag(flagByKey: Record<string, boolean> | undefined): number {
  if (!flagByKey) return 0;
  let n = 0;
  for (const [key, value] of Object.entries(flagByKey)) {
    if (value && isSpeciesKey(key)) n += 1;
  }
  return n;
}

/** Species slots only (skips special form boxes). */
export function speciesSlots(boxes: DexBox[]): DexSlot[] {
  const out: DexSlot[] = [];
  for (const box of boxes) {
    if (isFormsBox(box)) continue;
    for (const slot of box.slots) {
      if (!isSlotAvailable(slot)) continue;
      out.push(slot);
    }
  }
  return out;
}
