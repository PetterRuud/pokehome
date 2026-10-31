import { Input } from '@/components/ui/input';
import { SearchIcon, XIcon } from 'lucide-react';

export function DexSearchBar({
  value,
  onChange,
  matchCount,
  placeholder = 'Search name or #…',
}: {
  value: string;
  onChange: (next: string) => void;
  /** When filtering, number of visible matches (omit or ignore when empty query). */
  matchCount?: number;
  placeholder?: string;
}) {
  const hasQuery = value.trim().length > 0;

  return (
    <div className="flex w-full min-w-0 basis-full items-center gap-1.5 sm:w-auto sm:flex-1 sm:basis-auto">
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              e.preventDefault();
              onChange('');
            }
          }}
          placeholder={placeholder}
          aria-label="Search Pokémon"
          className="pr-8 pl-7 text-sm"
        />
        {hasQuery ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      {hasQuery ? (
        <span className="shrink-0 px-1 text-xs tabular-nums text-muted-foreground">
          {matchCount === 0 ? '0' : matchCount}
        </span>
      ) : null}
    </div>
  );
}
