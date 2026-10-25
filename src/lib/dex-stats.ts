import type { DexBox } from "@/lib/types";

function isSlotAvailable(slot: { available?: boolean }) {
  return slot.available !== false;
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
  const percent = total === 0 ? 0 : Math.round((caught / total) * 100);
  return { total, caught, percent };
}

export function countGameProgress(boxes: DexBox[], caughtMap: Record<string, boolean> | undefined) {
  return countProgress(boxes, caughtMap ?? {});
}

export function countFlag(flagByKey: Record<string, boolean> | undefined): number {
  if (!flagByKey) return 0;
  return Object.values(flagByKey).filter(Boolean).length;
}
