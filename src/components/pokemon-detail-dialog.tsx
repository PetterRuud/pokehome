import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

type DetailData = {
  id: number;
  summary: PokemonSummary;
  chain: EvoNode;
};

type DetailError = {
  id: number;
  message: string;
};

export function PokemonDetailDialog({ pokemonId, open, onOpenChange, gameId }: PokemonDetailDialogProps) {
  const [activeId, setActiveId] = useState<number | null>(pokemonId);
  const [openedId, setOpenedId] = useState<number | null>(null);
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState<DetailError | null>(null);

  // Sync active species when the dialog opens (or opens a different species).
  if (open && pokemonId != null && openedId !== pokemonId) {
    setOpenedId(pokemonId);
    setActiveId(pokemonId);
  }
  if (!open && openedId != null) {
    setOpenedId(null);
  }

  useEffect(() => {
    if (!open || activeId == null) return;
    const id = activeId;
    let cancelled = false;
    void Promise.all([getPokemonSummary({ data: { id: String(id) } }), getEvolutionChain({ data: { id: String(id) } })])
      .then(([summary, chain]) => {
        if (!cancelled) setData({ id, summary, chain });
      })
      .catch(() => {
        if (!cancelled) setError({ id, message: 'Could not load Pokémon details.' });
      });
    return () => {
      cancelled = true;
    };
  }, [open, activeId]);

  const ready = data?.id === activeId ? data : null;
  const failed = error?.id === activeId ? error : null;
  const loading = open && activeId != null && !ready && !failed;

  const navSearch = gameId ? { from: 'games' as const, game: gameId } : undefined;
  const { prev, next } = useMemo(
    () => (activeId != null ? pokemonNeighbors(activeId, gameId) : { prev: null, next: null }),
    [activeId, gameId],
  );
  const titleName = ready?.summary.name ?? (activeId != null ? `#${String(activeId).padStart(4, '0')}` : 'Pokémon');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{titleName}</DialogTitle>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : failed ? (
            <p className="text-sm text-muted-foreground">{failed.message}</p>
          ) : ready ? (
            <PokemonDetail
              summary={ready.summary}
              chain={ready.chain}
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
