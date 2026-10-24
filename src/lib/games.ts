import gamesData from "@/data/games.json";
import type { GameDex, GameId } from "@/lib/types";

export type GameGroup = {
  name: string;
  short: string;
  logo: string;
  games: GameDex[];
};

export function getGames(): GameDex[] {
  const games = gamesData.games as GameDex[];
  const go = games.filter((g) => g.id === "go");
  const rest = games.filter((g) => g.id !== "go");
  return [...rest, ...go];
}

export function getGame(id: GameId): GameDex | undefined {
  return getGames().find((g) => g.id === id);
}

/** Whether a national dex species appears in a game / DLC Pokédex. */
export function gameHasSpecies(game: GameDex, nationalId: number): boolean {
  const key = `n${nationalId}`;
  return game.boxes.some((box) =>
    box.slots.some((slot) => slot.id === nationalId || slot.key === key),
  );
}

/** Group HOME-style dexes by family (main + DLC together). */
export function getGameGroups(): GameGroup[] {
  const order: string[] = [];
  const map = new Map<string, GameGroup>();

  for (const game of getGames()) {
    let group = map.get(game.group);
    if (!group) {
      group = {
        name: game.group,
        short: game.groupShort,
        logo: game.logo,
        games: [],
      };
      map.set(game.group, group);
      order.push(game.group);
    }
    group.games.push(game);
  }

  return order.map((name) => map.get(name)!);
}

/** Game groups filtered to dexes that include a national species. */
export function getGameGroupsForSpecies(nationalId: number): GameGroup[] {
  return getGameGroups()
    .map((group) => ({
      ...group,
      games: group.games.filter((game) => gameHasSpecies(game, nationalId)),
    }))
    .filter((group) => group.games.length > 0);
}

export { LEGACY_GAME_ID_MAP, migrateCaughtByGame } from "@/lib/caught-by-game";
