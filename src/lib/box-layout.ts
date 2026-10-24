import type { BoxLayout, DexBox } from "@/lib/types";

export const EMPTY_BOX_LAYOUT: BoxLayout = {
  order: [],
  titles: {},
};

/** Apply custom titles + order on top of canonical boxes. */
export function applyBoxLayout(boxes: DexBox[], layout: BoxLayout | undefined): DexBox[] {
  if (!layout || (layout.order.length === 0 && Object.keys(layout.titles).length === 0)) {
    return boxes;
  }

  const byId = new Map(boxes.map((box) => [box.id, box]));
  const titled = (box: DexBox): DexBox => {
    const custom = layout.titles[box.id];
    if (!custom || custom === box.title) return box;
    return { ...box, title: custom };
  };

  const ordered: DexBox[] = [];
  const seen = new Set<string>();

  for (const id of layout.order) {
    const box = byId.get(id);
    if (!box || seen.has(id)) continue;
    ordered.push(titled(box));
    seen.add(id);
  }

  for (const box of boxes) {
    if (seen.has(box.id)) continue;
    ordered.push(titled(box));
  }

  return ordered;
}
