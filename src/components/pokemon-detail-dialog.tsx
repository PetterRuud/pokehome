import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PokemonNeighborButton } from '@/components/pokemon-adjacent-nav';
import { PokemonDetail, type PokemonSummary } from '@/components/pokemon-detail';
import type { EvoNode } from '@/lib/evolution';
import { pokemonNeighbors } from '@/lib/pokemon-neighbors';
import type { GameId } from '@/lib/types';
import { getEvolutionChain, getPokemonSummary } from '@/server/pokemon';

type PokemonDetailDialogProps = {
  pokemonId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When opened from a game dex, preserve game context on the permalink. */
  gameId?: GameId;
};

export function PokemonDetailDialog({ pokemonId, open, onOpenChange, gameId }: PokemonDetailDialogProps) {
  const [activeId, setActiveId] = useState<number | null>(pokemonId);
  const [summary, setSummary] = useState<PokemonSummary | null>(null);
  const [chain, setChain] = useState<EvoNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && pokemonId != null) setActiveId(pokemonId);
  }, [open, pokemonId]);

  useEffect(() => {
    if (!open || activeId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSummary(null);
    setChain(null);
    void Promise.all([
      getPokemonSummary({ data: { id: String(activeId) } }),
      getEvolutionChain({ data: { id: String(activeId) } }),
    ])
      .then(([nextSummary, nextChain]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setChain(nextChain);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load Pokémon details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeId]);

  const navSearch = gameId ? { from: 'games' as const, game: gameId } : undefined;
  const { prev, next } = useMemo(
    () => (activeId != null ? pokemonNeighbors(activeId, gameId) : { prev: null, next: null }),
    [activeId, gameId],
  );
  const titleName = summary?.name ?? (activeId != null ? `#${String(activeId).padStart(4, '0')}` : 'Pokémon');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="normal-case tracking-normal">{titleName}</DialogTitle>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground">{error}</p>
          ) : summary && chain ? (
            <PokemonDetail
              summary={summary}
              chain={chain}
              navSearch={navSearch}
              onSelectSpecies={setActiveId}
              permalink
            />
          ) : null}
        </div>

        {activeId != null ? (
          <DialogFooter className="sm:justify-between">
            {prev ? (
              <PokemonNeighborButton entry={prev} direction="prev" search={navSearch} onSelect={setActiveId} />
            ) : (
              <span />
            )}
            {next ? (
              <PokemonNeighborButton entry={next} direction="next" search={navSearch} onSelect={setActiveId} />
            ) : null}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
