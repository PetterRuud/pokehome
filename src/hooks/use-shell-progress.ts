import { useMemo } from 'react';
import { useRouterState } from '@tanstack/react-router';
import nationalDex from '@/data/national-dex.json';
import { countGameProgress, countProgress } from '@/lib/dex-stats';
import { getGame } from '@/lib/games';
import { useDexStore } from '@/lib/store';
import type { DexBox, GameId } from '@/lib/types';

export type ShellProgress = {
  caught: number;
  total: number;
  percent: number;
};

/** Header progress: active game HOME on /dex?tab=games, else national HOME. */
export function useShellProgress(): ShellProgress {
  const homeByKey = useDexStore((s) => s.homeByKey);
  const homeByGame = useDexStore((s) => s.homeByGame);
  const { pathname, search } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search as { tab?: string; game?: GameId },
    }),
  });

  return useMemo(() => {
    if (pathname === '/dex' && search.tab === 'games' && search.game) {
      const game = getGame(search.game);
      if (game) {
        return countGameProgress(game.boxes, homeByGame[game.id]);
      }
    }
    return countProgress(nationalDex.boxes as DexBox[], homeByKey);
  }, [pathname, search.tab, search.game, homeByKey, homeByGame]);
}
