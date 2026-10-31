import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PokemonDetail, type PokemonSummary } from '@/components/pokemon-detail';
import type { EvoNode } from '@/lib/evolution';
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
  const titleName = summary?.name ?? (activeId != null ? `#${String(activeId).padStart(4, '0')}` : 'Pokémon');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] w-full flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="pr-8 normal-case tracking-normal">{titleName}</DialogTitle>
          <DialogDescription>Living dex details. Open page for a shareable link.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pe-1">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
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
      </DialogContent>
    </Dialog>
  );
}
