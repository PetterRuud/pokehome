import type { BoxLayout, DexBox } from "@/lib/types";

export const EMPTY_BOX_LAYOUT: BoxLayout = {
  order: [],
  titles: {},
};

/** Apply custom box titles on top of canonical national order. */
export function applyBoxLayout(boxes: DexBox[], layout: BoxLayout | undefined): DexBox[] {
  if (!layout || Object.keys(layout.titles).length === 0) {
    return boxes;
  }

  return boxes.map((box) => {
    const custom = layout.titles[box.id];
    if (!custom || custom === box.title) return box;
    return { ...box, title: custom };
  });
}
