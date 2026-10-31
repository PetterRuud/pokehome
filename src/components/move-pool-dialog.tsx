import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { TypeBadge } from '@/components/type-badge';
import { parsePokemonType } from '@/lib/move-types';
import { getPokemonMovePool, type MovePool, type MovePoolEntry } from '@/server/pokemon';
import { ListIcon } from 'lucide-react';

const METHOD_SECTIONS: { id: string; label: string; match: (m: MovePoolEntry) => boolean }[] = [
  { id: 'level-up', label: 'Level-up', match: (m) => m.methods.includes('level-up') },
  { id: 'machine', label: 'TM / HM', match: (m) => m.methods.includes('machine') },
  { id: 'egg', label: 'Egg', match: (m) => m.methods.includes('egg') },
  { id: 'tutor', label: 'Tutor', match: (m) => m.methods.includes('tutor') },
  {
    id: 'other',
    label: 'Other',
    match: (m) => m.methods.every((method) => !['level-up', 'machine', 'egg', 'tutor'].includes(method)),
  },
];

type MovePoolDialogProps = {
  pokemonId: number;
  pokemonName: string;
};

type PoolResult = { status: 'ok'; pool: MovePool } | { status: 'error'; id: number; message: string };

export function MovePoolDialog({ pokemonId, pokemonName }: MovePoolDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<PoolResult | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = pokemonId;
    let cancelled = false;
    void getPokemonMovePool({ data: { id: String(id) } })
      .then((pool) => {
        if (!cancelled) setResult({ status: 'ok', pool });
      })
      .catch(() => {
        if (!cancelled) setResult({ status: 'error', id, message: 'Could not load move pool.' });
      });
    return () => {
      cancelled = true;
    };
  }, [open, pokemonId]);

  const pool = result?.status === 'ok' && result.pool.id === pokemonId ? result.pool : null;
  const error = result?.status === 'error' && result.id === pokemonId ? result.message : null;
  const loading = open && !pool && !error;

  const sections = useMemo(() => {
    if (!pool) return [];
    return METHOD_SECTIONS.map((section) => ({
      ...section,
      moves: pool.moves.filter(section.match),
    })).filter((section) => section.moves.length > 0);
  }, [pool]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="w-full" />}>
        <ListIcon data-icon="inline-start" />
        Move pool
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Move pool</DialogTitle>
          <DialogDescription>
            All learnable moves for {pokemonName} across games (PokeAPI), grouped by method.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-20" />
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error && sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No moves found.</p>
          ) : null}

          <div className="flex flex-col gap-5">
            {sections.map((section) => (
              <section key={section.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {section.label}
                  <span className="ms-1.5 font-normal tabular-nums">({section.moves.length})</span>
                </h3>
                <ul className="flex flex-wrap gap-1.5">
                  {section.moves.map((move) => {
                    const type = parsePokemonType(move.type);
                    const label =
                      section.id === 'level-up' && move.level != null ? `Lv.${move.level} ${move.name}` : move.name;
                    return (
                      <li key={`${section.id}-${move.slug}`}>
                        <TypeBadge label={label} type={type} title={`${move.type} · ${move.name}`} />
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
