import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PokemonAdjacentNav } from '@/components/pokemon-adjacent-nav';
import { PokemonDetail } from '@/components/pokemon-detail';
import { getEvolutionChain, getPokemonSummary } from '@/server/pokemon';
import { ArrowLeftIcon } from 'lucide-react';
import { gameHasSpecies, getGame } from '@/lib/games';
import { pokemonNeighbors } from '@/lib/pokemon-neighbors';
import type { GameId } from '@/lib/types';

type PokemonSearch = {
  /** Opened from a game dex — drives back link + adjacent order. */
  from?: 'games';
  game?: GameId;
};

export const Route = createFileRoute('/pokemon/$id')({
  validateSearch: (search: Record<string, unknown>): PokemonSearch => {
    const game =
      typeof search.game === 'string' && search.game.length > 0 && getGame(search.game) ? search.game : undefined;
    if (search.from === 'games' && game) return { from: 'games', game };
    return {};
  },
  loader: async ({ params }) => {
    const [summary, chain] = await Promise.all([
      getPokemonSummary({ data: { id: params.id } }),
      getEvolutionChain({ data: { id: params.id } }),
    ]);
    return { summary, chain };
  },
  pendingComponent: PokemonPending,
  errorComponent: PokemonError,
  component: PokemonPage,
});

function PokemonPending() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function PokemonError() {
  const search = Route.useSearch();
  const dexSearch = search.from === 'games' && search.game ? { tab: 'games' as const, game: search.game } : undefined;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-12 text-center">
      <p className="font-semibold">Pokémon not found</p>
      <Button variant="outline" render={<Link to="/dex" search={dexSearch} />} nativeButton={false}>
        Back to dex
      </Button>
    </div>
  );
}

function PokemonPage() {
  const { summary, chain } = Route.useLoaderData();
  const search = Route.useSearch();

  const fromGame = search.from === 'games' && search.game ? getGame(search.game) : undefined;
  const inGameOrder = Boolean(fromGame && gameHasSpecies(fromGame, summary.id));
  const { prev, next } = pokemonNeighbors(summary.id, inGameOrder && fromGame ? fromGame.id : undefined);
  const navSearch = fromGame ? search : undefined;
  const dexSearch = fromGame ? { tab: 'games' as const, game: fromGame.id } : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link to="/dex" search={dexSearch} />}
          nativeButton={false}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Dex
        </Button>
        <PokemonAdjacentNav prev={prev} next={next} search={navSearch} />
      </div>

      <PokemonDetail summary={summary} chain={chain} navSearch={navSearch} />

      <div className="flex w-full flex-col gap-4">
        <Separator />
        <PokemonAdjacentNav prev={prev} next={next} search={navSearch} className="w-full justify-between" />
      </div>
    </div>
  );
}
