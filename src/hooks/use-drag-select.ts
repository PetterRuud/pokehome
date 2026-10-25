import { useCallback, useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD_PX = 8;

/**
 * Paint-select Pokémon slots: press and drag across cells.
 * Short tap without drag falls through to onTap(key).
 */
export function useDragSelect(onTap?: (key: string) => void) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    startKey: null as string | null,
    paintMode: null as boolean | null, // true = add, false = remove
  });

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectKeys = useCallback((keys: string[]) => {
    setSelected(new Set(keys));
  }, []);

  const toggleKey = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const paintKey = useCallback((key: string, add: boolean) => {
    setSelected((prev) => {
      const has = prev.has(key);
      if (add === has) return prev;
      const next = new Set(prev);
      if (add) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const keyFromPoint = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y);
    const slot = el?.closest?.('[data-dex-key]') as HTMLElement | null;
    return slot?.dataset.dexKey ?? null;
  }, []);

  const onPointerDown = useCallback((key: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // Don't start drag-select from flag buttons / links
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag-select]')) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      startKey: key,
      paintMode: null,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active || !d.startKey) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

      if (!d.moved) {
        d.moved = true;
        setDragging(true);
        // First paint: if already selected, drag removes; else adds
        setSelected((prev) => {
          const add = !prev.has(d.startKey!);
          d.paintMode = add;
          const next = new Set(prev);
          if (add) next.add(d.startKey!);
          else next.delete(d.startKey!);
          return next;
        });
      }

      const key = keyFromPoint(e.clientX, e.clientY);
      if (key && d.paintMode != null) paintKey(key, d.paintMode);
    },
    [keyFromPoint, paintKey],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;

      const wasDrag = d.moved;
      const startKey = d.startKey;
      dragRef.current.active = false;
      dragRef.current.moved = false;
      dragRef.current.startKey = null;
      dragRef.current.paintMode = null;
      setDragging(false);

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }

      if (!wasDrag && startKey) {
        // Tap: if we already have a selection, toggle membership;
        // otherwise defer to normal catch toggle.
        setSelected((prev) => {
          if (prev.size > 0) {
            const next = new Set(prev);
            if (next.has(startKey)) next.delete(startKey);
            else next.add(startKey);
            return next;
          }
          onTap?.(startKey);
          return prev;
        });
      }
    },
    [onTap],
  );

  // Escape clears selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clear]);

  return {
    selected,
    selectedKeys: Array.from(selected),
    selectedCount: selected.size,
    dragging,
    clear,
    selectKeys,
    toggleKey,
    isSelected: (key: string) => selected.has(key),
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
