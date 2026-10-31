import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { PokemonNeighbor } from '@/lib/pokemon-neighbors';
import type { GameId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

type PokemonNavSearch = { from?: 'games'; game?: GameId };

function formatNavNumber(entry: PokemonNeighbor) {
  if (entry.entryNumber != null) return `#${String(entry.entryNumber).padStart(3, '0')}`;
  return `#${String(entry.id).padStart(4, '0')}`;
}

export function PokemonNeighborButton({
  entry,
  direction,
  search,
  onSelect,
}: {
  entry: PokemonNeighbor;
  direction: 'prev' | 'next';
  search?: PokemonNavSearch;
  onSelect?: (id: number) => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      nativeButton={onSelect == null ? false : undefined}
      render={
        onSelect == null ? (
          <Link to="/pokemon/$id" params={{ id: String(entry.id) }} search={search} />
        ) : undefined
      }
      onClick={onSelect ? () => onSelect(entry.id) : undefined}
    >
      {direction === 'prev' ? <ChevronLeftIcon data-icon="inline-start" /> : null}
      <span>
        <span className="text-muted-foreground tabular-nums">{formatNavNumber(entry)}</span> {entry.name}
      </span>
      {direction === 'next' ? <ChevronRightIcon data-icon="inline-end" /> : null}
    </Button>
  );
}

export function PokemonAdjacentNav({
  prev,
  next,
  search,
  onSelect,
  className,
}: {
  prev: PokemonNeighbor | null;
  next: PokemonNeighbor | null;
  search?: PokemonNavSearch;
  /** When set, buttons switch in-place instead of navigating. */
  onSelect?: (id: number) => void;
  className?: string;
}) {
  return (
    <nav className={cn('flex flex-wrap items-center justify-end gap-2', className)} aria-label="Adjacent Pokémon">
      {prev ? (
        <PokemonNeighborButton entry={prev} direction="prev" search={search} onSelect={onSelect} />
      ) : null}
      {next ? (
        <PokemonNeighborButton entry={next} direction="next" search={search} onSelect={onSelect} />
      ) : null}
    </nav>
  );
}
