import { useEffect, useMemo, useState } from 'react';
import { categorizeGifts } from '@/lib/gifts';
import { useDexStore } from '@/lib/store';
import { loadGiftFeed } from '@/server/gifts';
import type { MysteryGift } from '@/lib/types';

export type ActiveGiftStats = {
  /** Active + ending-soon (claimable now). */
  activeCount: number;
  /** Of those, not yet marked claimed. */
  unclaimedCount: number;
  endingSoonCount: number;
};

/** Active + ending-soon mystery gift counts (with claim progress). */
export function useActiveGiftStats(): ActiveGiftStats {
  const claimedGiftIds = useDexStore((s) => s.claimedGiftIds);
  const [live, setLive] = useState<MysteryGift[]>([]);
  const [endingSoonCount, setEndingSoonCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void loadGiftFeed()
      .then((feed) => {
        if (cancelled) return;
        const { active, endingSoon } = categorizeGifts(feed.gifts);
        setLive([...endingSoon, ...active]);
        setEndingSoonCount(endingSoon.length);
      })
      .catch(() => {
        // Feed unavailable — leave counts at 0
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => {
    const activeCount = live.length;
    const claimed = new Set(claimedGiftIds);
    const unclaimedCount = live.filter((g) => !claimed.has(g.id)).length;
    return { activeCount, unclaimedCount, endingSoonCount };
  }, [live, claimedGiftIds, endingSoonCount]);
}

/** Active + ending-soon mystery gifts (claimable now). */
export function useActiveGiftCount() {
  return useActiveGiftStats().activeCount;
}
