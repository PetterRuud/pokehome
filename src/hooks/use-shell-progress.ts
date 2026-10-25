import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import nationalDex from "@/data/national-dex.json";
import { countGameProgress, countProgress } from "@/lib/dex-stats";
import { getGame } from "@/lib/games";
import { useDexStore } from "@/lib/store";
import type { GameId } from "@/lib/types";

export type ShellProgress = {
  caught: number;
  total: number;
  percent: number;
};

/** Header progress: active game dex on /dex?tab=games, else national. */
export function useShellProgress(): ShellProgress {
  const caughtByKey = useDexStore((s) => s.caughtByKey);
  const caughtByGame = useDexStore((s) => s.caughtByGame);
  const { pathname, search } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search as { tab?: string; game?: GameId },
    }),
  });

  return useMemo(() => {
    if (pathname === "/dex" && search.tab === "games" && search.game) {
      const game = getGame(search.game);
      if (game) {
        return countGameProgress(game.boxes, caughtByGame[game.id]);
      }
    }
    return countProgress(nationalDex.boxes, caughtByKey);
  }, [pathname, search.tab, search.game, caughtByKey, caughtByGame]);
}
