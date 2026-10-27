import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, XIcon } from 'lucide-react';

export function DexSearchBar({
  value,
  onChange,
  matchCount,
  activeIndex,
  onPrev,
  onNext,
  placeholder = 'Search name or #…',
}: {
  value: string;
  onChange: (next: string) => void;
  matchCount: number;
  /** 0-based index into matches; -1 when none. */
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  placeholder?: string;
}) {
  const hasQuery = value.trim().length > 0;
  const hasMatches = matchCount > 0;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) onPrev();
              else onNext();
            } else if (e.key === 'Escape' && value) {
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
        <div className="flex shrink-0 items-center gap-0.5">
          <span className="px-1 text-xs tabular-nums text-muted-foreground">
            {hasMatches ? `${activeIndex + 1}/${matchCount}` : '0'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!hasMatches}
            onClick={onPrev}
            aria-label="Previous match"
          >
            <ChevronUpIcon className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={!hasMatches}
            onClick={onNext}
            aria-label="Next match"
          >
            <ChevronDownIcon className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
