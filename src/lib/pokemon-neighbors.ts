import nationalDex from '@/data/national-dex.json';
import { gameHasSpecies, gameNeighbors, getGame } from '@/lib/games';
import type { GameId } from '@/lib/types';

export type PokemonNeighbor = {
  id: number;
  name: string;
  entryNumber?: number;
};

const nationalOrder = (() => {
  const slots: PokemonNeighbor[] = [];
  for (const box of nationalDex.boxes as Array<{ slots: Array<{ id: number; name: string }> }>) {
    for (const slot of box.slots) slots.push({ id: slot.id, name: slot.name });
  }
  return slots;
})();

const nationalIndexById = new Map(nationalOrder.map((slot, index) => [slot.id, index]));

export function nationalNeighbors(id: number): { prev: PokemonNeighbor | null; next: PokemonNeighbor | null } {
  const index = nationalIndexById.get(id);
  if (index == null) return { prev: null, next: null };
  return {
    prev: index > 0 ? nationalOrder[index - 1]! : null,
    next: index < nationalOrder.length - 1 ? nationalOrder[index + 1]! : null,
  };
}

/** Neighbors in game dex order when possible, otherwise national order. */
export function pokemonNeighbors(
  id: number,
  gameId?: GameId,
): { prev: PokemonNeighbor | null; next: PokemonNeighbor | null } {
  const game = gameId ? getGame(gameId) : undefined;
  if (game && gameHasSpecies(game, id)) return gameNeighbors(game, id);
  return nationalNeighbors(id);
}
