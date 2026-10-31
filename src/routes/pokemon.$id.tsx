import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PokemonDetail } from '@/components/pokemon-detail';
import { getEvolutionChain, getPokemonSummary } from '@/server/pokemon';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { gameHasSpecies, gameNeighbors, getGame } from '@/lib/games';
import type { GameId } from '@/lib/types';
import nationalDex from '@/data/national-dex.json';

type PokemonSearch = {
  /** Opened from a game dex — drives back link + adjacent order. */
  from?: 'games';
  game?: GameId;
};

const nationalOrder = (() => {
  const slots: { id: number; name: string }[] = [];
  for (const box of nationalDex.boxes as Array<{ slots: Array<{ id: number; name: string }> }>) {
    for (const slot of box.slots) slots.push({ id: slot.id, name: slot.name });
  }
  return slots;
})();

const nationalIndexById = new Map(nationalOrder.map((slot, index) => [slot.id, index]));

function nationalNeighbors(id: number) {
  const index = nationalIndexById.get(id);
  if (index == null) return { prev: null, next: null };
  return {
    prev: index > 0 ? nationalOrder[index - 1]! : null,
    next: index < nationalOrder.length - 1 ? nationalOrder[index + 1]! : null,
  };
}

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
  const { prev, next } = inGameOrder && fromGame ? gameNeighbors(fromGame, summary.id) : nationalNeighbors(summary.id);
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

      <PokemonDetail summary={summary} chain={chain} navSearch={navSearch} permalink={false} />

      <div className="flex w-full flex-col gap-4">
        <Separator />
        <PokemonAdjacentNav prev={prev} next={next} search={navSearch} className="w-full justify-between" />
      </div>
    </div>
  );
}

function formatNavNumber(entry: { id: number; entryNumber?: number }) {
  if (entry.entryNumber != null) return `#${String(entry.entryNumber).padStart(3, '0')}`;
  return `#${String(entry.id).padStart(4, '0')}`;
}

function PokemonAdjacentNav({
  prev,
  next,
  search,
  className,
}: {
  prev: { id: number; name: string; entryNumber?: number } | null;
  next: { id: number; name: string; entryNumber?: number } | null;
  search?: PokemonSearch;
  className?: string;
}) {
  return (
    <nav className={cn('flex flex-wrap items-center justify-end gap-2', className)} aria-label="Adjacent Pokémon">
      {prev ? (
        <Button
          variant="outline"
          size="sm"
          render={<Link to="/pokemon/$id" params={{ id: String(prev.id) }} search={search} />}
          nativeButton={false}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          <span>
            <span className="text-muted-foreground tabular-nums">{formatNavNumber(prev)}</span> {prev.name}
          </span>
        </Button>
      ) : null}
      {next ? (
        <Button
          variant="outline"
          size="sm"
          className={cn(!prev && 'ms-auto')}
          render={<Link to="/pokemon/$id" params={{ id: String(next.id) }} search={search} />}
          nativeButton={false}
        >
          <span>
            <span className="text-muted-foreground tabular-nums">{formatNavNumber(next)}</span> {next.name}
          </span>
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      ) : null}
    </nav>
  );
}
