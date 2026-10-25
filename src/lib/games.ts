import gamesData from '@/data/games.json';
import type { GameDex, GameId } from '@/lib/types';

export type GameGroup = {
  name: string;
  short: string;
  logo: string;
  games: GameDex[];
};

export function getGames(): GameDex[] {
  const games = gamesData.games as GameDex[];
  const go = games.filter((g) => g.id === 'go');
  const rest = games.filter((g) => g.id !== 'go');
  return [...rest, ...go];
}

export function getGame(id: GameId): GameDex | undefined {
  return getGames().find((g) => g.id === id);
}

/** Whether a national dex species appears in a game / DLC Pokédex. */
export function gameHasSpecies(game: GameDex, nationalId: number): boolean {
  const key = `n${nationalId}`;
  return game.boxes.some((box) => box.slots.some((slot) => slot.id === nationalId || slot.key === key));
}

export type GameSpeciesNav = {
  id: number;
  name: string;
  entryNumber?: number;
};

/** Unique species in game dex order (first slot wins for dual mega entries). */
export function getGameSpeciesOrder(game: GameDex): GameSpeciesNav[] {
  const seen = new Set<number>();
  const out: GameSpeciesNav[] = [];
  for (const box of game.boxes) {
    for (const slot of box.slots) {
      if (seen.has(slot.id)) continue;
      seen.add(slot.id);
      out.push({
        id: slot.id,
        name: slot.name,
        entryNumber: slot.entryNumber,
      });
    }
  }
  return out;
}

export function gameNeighbors(
  game: GameDex,
  nationalId: number,
): { prev: GameSpeciesNav | null; next: GameSpeciesNav | null } {
  const order = getGameSpeciesOrder(game);
  const index = order.findIndex((s) => s.id === nationalId);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: index > 0 ? order[index - 1]! : null,
    next: index < order.length - 1 ? order[index + 1]! : null,
  };
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

export { LEGACY_GAME_ID_MAP, migrateCaughtByGame } from '@/lib/caught-by-game';
