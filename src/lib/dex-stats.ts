import type { DexBox } from '@/lib/types';

function isSlotAvailable(slot: { available?: boolean }) {
  return slot.available !== false;
}

/** Percent of a dex: 0 when empty, 100 only when complete, otherwise 1–99 via floor. */
export function toPercent(caught: number, total: number): number {
  if (total <= 0 || caught <= 0) return 0;
  if (caught >= total) return 100;
  return Math.min(99, Math.max(1, Math.floor((caught / total) * 100)));
}

export function countProgress(boxes: DexBox[], caughtByKey: Record<string, boolean>) {
  let total = 0;
  let caught = 0;
  for (const box of boxes) {
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
