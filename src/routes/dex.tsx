import { createFileRoute, Link } from '@tanstack/react-router';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import {
  AddToDialogButton,
  applyAddToOptions,
  applyGameAddOptions,
  GameAddDialogButton,
  summarizeAddOptions,
  summarizeGameAddOptions,
  type AddToOptions,
  type GameAddOptions,
} from '@/components/add-to-dialog';
import { ConfirmAlertDialog, type ConfirmRequest } from '@/components/confirm-alert-dialog';
import { DexSearchBar } from '@/components/dex-search';
import { DexSlotButton } from '@/components/dex-slot';
import { GameLogo } from '@/components/game-logo';
import { PokeballIcon } from '@/components/pokeball-logo';
import { PokemonSprite } from '@/components/pokemon-sprite';
import { applyBoxLayout } from '@/lib/box-layout';
import { cardSizeConfig, gridColumnCount, resolveCardSize } from '@/lib/card-size';
import { filterSlotsByQuery } from '@/lib/dex-search';
import { useDexStore } from '@/lib/store';
import { countGameProgress, countProgress } from '@/lib/dex-stats';
import { filterBoxesForFormView, gmaxSpeciesCount, megaSpeciesCount, regionalSpeciesCount } from '@/lib/form-variants';
import { getGame, getGames } from '@/lib/games';
import nationalDex from '@/data/national-dex.json';
import type { CardSize, DexBox, DexSlot, FormView, GameId, SpriteStyle } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  CheckIcon,
  ChevronDownIcon,
  ExpandIcon,
  EyeIcon,
  CheckCheckIcon,
  EraserIcon,
  GlobeIcon,
  HomeIcon,
  InfoIcon,
  LayoutGridIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

function useDexSearchState(slots: DexSlot[]) {
  const [query, setQueryState] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => filterSlotsByQuery(slots, query), [slots, query]);

  const safeIndex = matches.length === 0 ? -1 : Math.min(activeIndex, matches.length - 1);
  const activeKey = safeIndex >= 0 ? (matches[safeIndex]?.key ?? null) : null;
  const hitKeys = useMemo(() => new Set(matches.map((s) => s.key)), [matches]);

  function setQuery(next: string) {
    setQueryState(next);
    setActiveIndex(0);
  }

  function goNext() {
    if (matches.length === 0) return;
    setActiveIndex((i) => (i + 1) % matches.length);
  }

  function goPrev() {
    if (matches.length === 0) return;
    setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
  }

  return {
    query,
    setQuery,
    matches,
    activeIndex: safeIndex,
    activeKey,
    hitKeys,
    goNext,
    goPrev,
  };
}
import { toast } from 'sonner';

/** Sit under the app shell sticky header (h-14). */
const DEX_STICKY_TOOLBAR =
  'sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6';

const EMPTY_CAUGHT: Record<string, boolean> = {};
const EMPTY_HOME: Record<string, boolean> = {};
const NAT_HEADER_HEIGHT = 44;

type NationalVirtualRow =
  | {
      type: 'header';
      box: DexBox;
      caughtCount: number;
      complete: boolean;
      keys: string[];
      missing: string[];
    }
  | { type: 'grid'; boxId: string; slots: DexSlot[] };

function useGridColumnCount(width: number, cardSize: CardSize) {
  return gridColumnCount(width, cardSize);
}

const FORM_VIEW_OPTIONS: {
  value: FormView;
  label: string;
  icon: ComponentType<{ className?: string } & SVGProps<SVGSVGElement>>;
  iconClassName?: string;
}[] = [
  { value: 'home', label: 'HOME', icon: HomeIcon, iconClassName: 'text-emerald-600' },
  { value: 'default', label: 'Caught', icon: PokeballIcon },
  { value: 'shiny', label: 'Shiny', icon: SparklesIcon, iconClassName: 'text-amber-500' },
  { value: 'alpha', label: 'Alpha', icon: EyeIcon, iconClassName: 'text-red-500' },
  { value: 'mega', label: 'Mega', icon: ZapIcon, iconClassName: 'text-violet-500' },
  { value: 'gmax', label: 'Gmax', icon: ExpandIcon, iconClassName: 'text-rose-500' },
  { value: 'regional', label: 'Regional', icon: GlobeIcon, iconClassName: 'text-sky-500' },
];

function FormViewMenu({
  value,
  onChange,
  className,
}: {
  value: FormView;
  onChange: (value: FormView) => void;
  className?: string;
}) {
  const current = FORM_VIEW_OPTIONS.find((opt) => opt.value === value) ?? FORM_VIEW_OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={className}
            aria-label={`Form view: ${current.label}`}
          />
        }
      >
        <CurrentIcon data-icon="inline-start" className={current.iconClassName} />
        {current.label}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as FormView)}>
          {FORM_VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <Icon className={opt.iconClassName} />
                {opt.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type GameTrack = 'caught' | 'home';

const GAME_TRACK_OPTIONS: {
  value: GameTrack;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName?: string;
}[] = [
  { value: 'home', label: 'HOME', icon: HomeIcon, iconClassName: 'text-emerald-600' },
  { value: 'caught', label: 'Caught', icon: CheckIcon },
];

function GameTrackMenu({
  value,
  onChange,
  className,
}: {
  value: GameTrack;
  onChange: (value: GameTrack) => void;
  className?: string;
}) {
  const current = GAME_TRACK_OPTIONS.find((opt) => opt.value === value) ?? GAME_TRACK_OPTIONS[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={className}
            aria-label={`Track: ${current.label}`}
          />
        }
      >
        <CurrentIcon data-icon="inline-start" className={current.iconClassName} />
        {current.label}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as GameTrack)}>
          {GAME_TRACK_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <Icon className={opt.iconClassName} />
                {opt.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const GAME_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'missing', label: 'Missing' },
  { value: 'done', label: 'Done' },
] as const;

type GameFilter = (typeof GAME_FILTER_OPTIONS)[number]['value'];

function GameFilterMenu({
  value,
  onChange,
  track,
  className,
}: {
  value: GameFilter;
  onChange: (value: GameFilter) => void;
  track: GameTrack;
  className?: string;
}) {
  const doneLabel = track === 'home' ? 'HOME' : 'Caught';
  const options = GAME_FILTER_OPTIONS.map((opt) => (opt.value === 'done' ? { ...opt, label: doneLabel } : opt));
  const current = options.find((opt) => opt.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={className}
            aria-label={`Filter: ${current.label}`}
          />
        }
      >
        {current.label}
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as GameFilter)}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type DexSearch = {
  tab?: 'national' | 'games';
  game?: GameId;
};

export const Route = createFileRoute('/dex')({
  validateSearch: (search: Record<string, unknown>): DexSearch => {
    const tab = search.tab === 'games' ? 'games' : 'national';
    const rawGame = typeof search.game === 'string' && search.game.length > 0 ? search.game : undefined;
    const game = rawGame && getGame(rawGame) ? rawGame : undefined;
    return {
      tab,
      ...(game ? { game } : {}),
    };
  },
  component: DexPage,
});

function DexPage() {
  const homeByGame = useDexStore((s) => s.homeByGame);
  const games = getGames();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab === 'games' ? 'games' : 'national';
  const gameId: GameId = (search.game && getGame(search.game)?.id) || games[0]?.id || 'sv-paldea';

  // Keep ?game= in sync when browsing the Games tab
  useEffect(() => {
    if (tab !== 'games') return;
    if (search.game === gameId) return;
    void navigate({
      to: '/dex',
      search: { tab: 'games', game: gameId },
      replace: true,
    });
  }, [tab, gameId, search.game, navigate]);

  function setTab(next: 'national' | 'games') {
    void navigate({
      to: '/dex',
      search: next === 'games' ? { tab: 'games', game: gameId } : { tab: 'national' },
    });
  }

  function selectGame(id: GameId) {
    void navigate({
      to: '/dex',
      search: { tab: 'games', game: id },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Living dex</h1>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (v === 'national' || v === 'games') setTab(v);
        }}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="national">National</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
        </TabsList>

        <TabsContent value="national" className="mt-4">
          <NationalDexView />
        </TabsContent>

        <TabsContent value="games" className="mt-4 flex flex-col gap-4">
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[gameId]}
            onValueChange={(next) => {
              const id = next[0];
              if (id) selectGame(id);
            }}
            className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
          >
            {games.map((game) => {
              const { caught, total } = countGameProgress(game.boxes, homeByGame[game.id]);
              const complete = total > 0 && caught === total;
              return (
                <ToggleGroupItem
                  key={game.id}
                  value={game.id}
                  aria-label={complete ? `${game.name}, complete` : `${game.name}, ${caught} of ${total} in HOME`}
                  title={game.name}
                  className="h-auto min-w-0 flex-col gap-1.5 whitespace-normal px-2.5 py-2.5"
                >
                  <GameLogo logo={game.logo} title={game.name} variant="wordmark" className="h-7 max-w-full" />
                  <span className="flex max-w-full flex-wrap items-center justify-center gap-1">
                    <span className="text-center text-xs leading-tight font-medium">{game.name}</span>
                    {game.kind === 'dlc' ? <Badge variant="secondary">DLC</Badge> : null}
                  </span>
                  {complete ? (
                    <Badge
                      variant="secondary"
                      className="border-transparent bg-emerald-600/15 text-emerald-600"
                    >
                      <CheckIcon data-icon="inline-start" aria-hidden />
                      Complete
                    </Badge>
                  ) : (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {caught}/{total}
                    </span>
                  )}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
          <GameDexView gameId={gameId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NationalDexView() {
  const caughtByKey = useDexStore((s) => s.caughtByKey);
  const homeByKey = useDexStore((s) => s.homeByKey);
  const shinyByKey = useDexStore((s) => s.shinyByKey);
  const alphaByKey = useDexStore((s) => s.alphaByKey);
  const megaByKey = useDexStore((s) => s.megaByKey);
  const gmaxByKey = useDexStore((s) => s.gmaxByKey);
  const regionalByKey = useDexStore((s) => s.regionalByKey);
  const setCaughtMany = useDexStore((s) => s.setCaughtMany);
  const setHomeMany = useDexStore((s) => s.setHomeMany);
  const setShinyMany = useDexStore((s) => s.setShinyMany);
  const setAlphaMany = useDexStore((s) => s.setAlphaMany);
  const setMegaMany = useDexStore((s) => s.setMegaMany);
  const setGmaxMany = useDexStore((s) => s.setGmaxMany);
  const setRegionalMany = useDexStore((s) => s.setRegionalMany);
  const setGamesCaughtMany = useDexStore((s) => s.setGamesCaughtMany);
  const setGamesHomeMany = useDexStore((s) => s.setGamesHomeMany);
  const nationalBoxLayout = useDexStore((s) => s.nationalBoxLayout);
  const renameNationalBox = useDexStore((s) => s.renameNationalBox);
  const prefs = useDexStore((s) => s.prefs);
  const setPref = useDexStore((s) => s.setPref);
  const formView = prefs.formView;
  const spriteStyle = prefs.spriteStyle;
  const cardSize = resolveCardSize(prefs.cardSize);
  const cardLayout = cardSizeConfig(cardSize);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [renameBox, setRenameBox] = useState<DexBox | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  const boxes = useMemo(() => {
    const laidOut = applyBoxLayout(nationalDex.boxes as DexBox[], nationalBoxLayout);
    return filterBoxesForFormView(laidOut, formView);
  }, [nationalBoxLayout, formView]);

  useEffect(() => {
    setSelected(new Set());
  }, [formView]);

  const defaultTitles = useMemo(() => {
    const map: Record<string, string> = {};
    for (const box of nationalDex.boxes as DexBox[]) map[box.id] = box.title;
    return map;
  }, []);

  const flagByKey =
    formView === 'home'
      ? homeByKey
      : formView === 'shiny'
        ? shinyByKey
        : formView === 'alpha'
          ? alphaByKey
          : formView === 'mega'
            ? megaByKey
            : formView === 'gmax'
              ? gmaxByKey
              : formView === 'regional'
                ? regionalByKey
                : null;

  const progressByKey = flagByKey ?? caughtByKey;

  const formProgress = useMemo(() => {
    // Special form boxes are excluded from national progress (species living dex only).
    if (formView === 'default') {
      return countProgress(boxes, caughtByKey);
    }
    return countProgress(boxes, flagByKey ?? {});
  }, [formView, boxes, caughtByKey, flagByKey]);

  const trackLabel =
    formView === 'default'
      ? 'caught'
      : formView === 'home'
        ? 'HOME'
        : formView === 'shiny'
          ? 'shiny'
          : formView === 'alpha'
            ? 'alpha'
            : formView === 'mega'
              ? 'mega'
              : formView === 'gmax'
                ? 'gmax'
                : 'regional';

  const allSlots = useMemo(() => boxes.flatMap((box) => box.slots), [boxes]);
  const allKeys = useMemo(() => allSlots.map((s) => s.key), [allSlots]);
  const selectedCount = selected.size;
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));
  const search = useDexSearchState(allSlots);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => {
      setScrollWidth(el.clientWidth);
      setScrollMargin(el.offsetTop);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [boxes.length, formView, cardSize]);

  const colCount = useGridColumnCount(scrollWidth, cardSize);

  const virtualRows = useMemo(() => {
    const rows: NationalVirtualRow[] = [];
    for (const box of boxes) {
      const keys = box.slots.map((s) => s.key);
      const caughtCount = keys.filter((k) => Boolean(progressByKey[k])).length;
      const complete = caughtCount === keys.length && keys.length > 0;
      rows.push({
        type: 'header',
        box,
        caughtCount,
        complete,
        keys,
        missing: keys.filter((k) => !progressByKey[k]),
      });
      for (let i = 0; i < box.slots.length; i += colCount) {
        rows.push({
          type: 'grid',
          boxId: box.id,
          slots: box.slots.slice(i, i + colCount),
        });
      }
    }
    return rows;
  }, [boxes, progressByKey, colCount]);

  // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual intentionally skips compiler memoization
  const virtualizer = useWindowVirtualizer({
    count: virtualRows.length,
    estimateSize: (index) => (virtualRows[index]?.type === 'header' ? NAT_HEADER_HEIGHT : cardLayout.gridRowHeight),
    overscan: 6,
    scrollMargin,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [colCount, scrollMargin, virtualRows.length, formView, cardSize, cardLayout.gridRowHeight, virtualizer]);

  useEffect(() => {
    if (!search.activeKey) return;
    const rowIndex = virtualRows.findIndex(
      (row) => row.type === 'grid' && row.slots.some((slot) => slot.key === search.activeKey),
    );
    if (rowIndex >= 0) {
      virtualizer.scrollToIndex(rowIndex, { align: 'center' });
    }
  }, [search.activeKey, virtualRows, virtualizer]);

  function setMany(keys: string[], value: boolean) {
    if (formView === 'home') setHomeMany(keys, value);
    else if (formView === 'shiny') setShinyMany(keys, value);
    else if (formView === 'alpha') setAlphaMany(keys, value);
    else if (formView === 'mega') setMegaMany(keys, value);
    else if (formView === 'gmax') setGmaxMany(keys, value);
    else if (formView === 'regional') setRegionalMany(keys, value);
    else setCaughtMany(keys, value);
  }

  function toggleSelected(key: string, next: boolean) {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(key);
      else out.delete(key);
      return out;
    });
  }

  function toggleSelectAll(next: boolean) {
    setSelected((prev) => {
      const out = new Set(prev);
      for (const key of allKeys) {
        if (next) out.add(key);
        else out.delete(key);
      }
      return out;
    });
  }

  function addSelected(options: AddToOptions) {
    if (selectedCount === 0) return;
    const keys = Array.from(selected);
    applyAddToOptions(keys, options, {
      setCaughtMany,
      setHomeMany,
      setShinyMany,
      setAlphaMany,
      setMegaMany,
      setGmaxMany,
      setRegionalMany,
      setGamesCaughtMany,
      setGamesHomeMany,
    });
    setSelected(new Set());
    toast.success(
      keys.length === 1
        ? `Added 1 · ${summarizeAddOptions(options)}`
        : `Added ${keys.length} · ${summarizeAddOptions(options)}`,
    );
  }

  function clearSelected() {
    if (selectedCount === 0) return;
    const keys = Array.from(selected);
    setConfirm({
      title: selectedCount === 1 ? `Clear ${trackLabel}?` : `Clear ${selectedCount} ${trackLabel}?`,
      description:
        selectedCount === 1
          ? `This removes the ${trackLabel} mark for the selected Pokémon.`
          : `This removes the ${trackLabel} mark for ${selectedCount} selected Pokémon.`,
      confirmLabel: 'Clear',
      onConfirm: () => {
        setMany(keys, false);
        setSelected(new Set());
        toast.success(keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`);
      },
    });
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col gap-3">
      <div className={DEX_STICKY_TOOLBAR}>
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected && !allSelected}
          onCheckedChange={(v) => toggleSelectAll(v)}
          aria-label={selectedCount > 0 ? `Select all · ${selectedCount} selected` : 'Select all'}
        />
        <AddToDialogButton
          selectedKeys={Array.from(selected)}
          disabled={selectedCount === 0}
          onAdd={addSelected}
        />
        <Button variant="outline" disabled={selectedCount === 0} onClick={clearSelected}>
          Clear
        </Button>
        <FormViewMenu
          value={formView}
          onChange={(value) => setPref('formView', value)}
          className="shrink-0"
        />
        <DexSearchBar
          value={search.query}
          onChange={search.setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          onPrev={search.goPrev}
          onNext={search.goNext}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {formView === 'mega'
          ? `Mega · ${formProgress.caught} / ${megaSpeciesCount()}`
          : formView === 'gmax'
            ? `Gmax · ${formProgress.caught} / ${gmaxSpeciesCount()}`
            : formView === 'regional'
              ? `Regional · ${formProgress.caught} / ${regionalSpeciesCount()}`
              : formView === 'home' || formView === 'shiny' || formView === 'alpha'
                ? `${trackLabel} · ${formProgress.caught} marked`
                : `National · ${formProgress.caught} / ${formProgress.total}`}
      </p>

      {boxes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No Pokémon here</EmptyTitle>
            <EmptyDescription>Try another form view.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualItems.map((item) => {
            const row = virtualRows[item.index];
            if (!row) return null;

            if (row.type === 'header') {
              return (
                <div
                  key={`h-${row.box.id}`}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full"
                  style={{ transform: `translateY(${item.start - scrollMargin}px)` }}
                >
                  <NationalBoxHeader
                    box={row.box}
                    caughtCount={row.caughtCount}
                    complete={row.complete}
                    addAllLabel={formView === 'default' ? 'Add all' : `Mark all ${trackLabel}`}
                    clearAllLabel={formView === 'default' ? 'Clear box' : `Clear ${trackLabel}`}
                    onRename={() => {
                      setRenameBox(row.box);
                      setRenameValue(row.box.title);
                    }}
                    onAddAll={() => {
                      const keys = row.missing.length > 0 ? row.missing : row.keys;
                      setMany(keys, true);
                      toast.success(
                        keys.length === 1 ? `Marked 1 ${trackLabel}` : `Marked ${keys.length} ${trackLabel}`,
                      );
                    }}
                    onClearAll={() => {
                      const keys = row.keys;
                      setConfirm({
                        title: keys.length === 1 ? `Clear ${trackLabel}?` : `Clear box ${trackLabel}?`,
                        description:
                          keys.length === 1
                            ? `This removes the ${trackLabel} mark for this Pokémon.`
                            : `This removes the ${trackLabel} mark for all ${keys.length} Pokémon in this box.`,
                        confirmLabel: 'Clear',
                        onConfirm: () => {
                          setMany(keys, false);
                          toast.success(
                            keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`,
                          );
                        },
                      });
                    }}
                  />
                </div>
              );
            }

            return (
              <div
                key={`g-${row.boxId}-${row.slots[0]?.key ?? item.index}`}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 grid w-full gap-1.5 px-0.5 py-1 sm:gap-2"
                style={{
                  transform: `translateY(${item.start - scrollMargin}px)`,
                  gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                }}
              >
                {row.slots.map((slot) => (
                  <DexSlotButton
                    key={slot.key}
                    slot={slot}
                    caught={Boolean(caughtByKey[slot.key])}
                    formView={formView}
                    flagged={Boolean(flagByKey?.[slot.key])}
                    spriteStyle={spriteStyle}
                    cardSize={cardSize}
                    selected={selected.has(slot.key)}
                    searchHit={search.hitKeys.has(slot.key)}
                    searchActive={search.activeKey === slot.key}
                    onSelectedChange={(next) => toggleSelected(slot.key, next)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={renameBox != null}
        onOpenChange={(open) => {
          if (!open) setRenameBox(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename box</DialogTitle>
            <DialogDescription>
              Custom name for this living-dex box. Leave blank to restore the default
              {renameBox ? ` (“${defaultTitles[renameBox.id] ?? renameBox.title}”).` : '.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="box-rename">Name</Label>
            <Input
              id="box-rename"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameBox) {
                  renameNationalBox(renameBox.id, renameValue, defaultTitles[renameBox.id] ?? renameBox.title);
                  setRenameBox(null);
                  toast.success('Box renamed');
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (!renameBox) return;
                renameNationalBox(renameBox.id, renameValue, defaultTitles[renameBox.id] ?? renameBox.title);
                setRenameBox(null);
                toast.success('Box renamed');
              }}
            >
              Save
            </Button>
            <Button type="button" variant="outline" onClick={() => setRenameBox(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmAlertDialog
        request={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}

function NationalBoxHeader({
  box,
  caughtCount,
  complete,
  addAllLabel,
  clearAllLabel,
  onRename,
  onAddAll,
  onClearAll,
}: {
  box: DexBox;
  caughtCount: number;
  complete: boolean;
  addAllLabel: string;
  clearAllLabel: string;
  onRename: () => void;
  onAddAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-background/80 px-1 py-1.5 backdrop-blur">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pl-1">
        <span className="truncate font-semibold">{box.title}</span>
        <span className="text-xs text-muted-foreground">{box.rangeLabel}</span>
        <Badge variant="outline">
          {caughtCount}/{box.slots.length}
        </Badge>
        {complete ? (
          <Badge variant="secondary" className="border-transparent bg-emerald-600/15 text-emerald-600">
            Done
          </Badge>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label={`${box.title} actions`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuGroup>
            {!complete ? (
              <DropdownMenuItem onClick={onAddAll}>
                <CheckCheckIcon />
                {addAllLabel}
              </DropdownMenuItem>
            ) : null}
            {caughtCount > 0 ? (
              <DropdownMenuItem variant="destructive" onClick={onClearAll}>
                <EraserIcon />
                {clearAllLabel}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function GameDexView({ gameId }: { gameId: GameId }) {
  const game = getGame(gameId);
  const caughtMap = useDexStore((s) => s.caughtByGame[gameId] ?? EMPTY_CAUGHT);
  const homeMap = useDexStore((s) => s.homeByGame[gameId] ?? EMPTY_HOME);
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);
  const cardSize = useDexStore((s) => resolveCardSize(s.prefs.cardSize));
  const cardLayout = cardSizeConfig(cardSize);
  const setGameCaughtMany = useDexStore((s) => s.setGameCaughtMany);
  const setGameHomeMany = useDexStore((s) => s.setGameHomeMany);
  const [track, setTrack] = useState<GameTrack>('home');
  const [filter, setFilter] = useState<GameFilter>('all');
  const [layout, setLayout] = useState<'list' | 'grid'>('grid');
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  const trackMap = track === 'home' ? homeMap : caughtMap;
  const trackLabel = track === 'home' ? 'HOME' : 'caught';

  useEffect(() => {
    setSelected(new Set());
  }, [gameId, filter, track]);

  const slots = useMemo(() => game?.boxes.flatMap((box) => box.slots) ?? [], [game]);
  const search = useDexSearchState(slots);

  const visible = useMemo(() => {
    if (filter === 'all') return slots;
    if (filter === 'done') {
      return slots.filter((s) => s.available !== false && trackMap[s.key]);
    }
    // Missing: obtainable but not marked on the active track
    return slots.filter((s) => s.available !== false && !trackMap[s.key]);
  }, [slots, filter, trackMap]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => {
      setScrollWidth(el.clientWidth);
      setScrollMargin(el.offsetTop);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [layout, gameId, visible.length, cardSize]);

  const colCount = useGridColumnCount(scrollWidth, cardSize);
  const rowCount = layout === 'grid' ? Math.ceil(visible.length / colCount) : visible.length;

  // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual intentionally skips compiler memoization
  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (layout === 'list' ? cardLayout.listRowHeight : cardLayout.gridRowHeight),
    overscan: 8,
    scrollMargin,
  });

  useLayoutEffect(() => {
    virtualizer.measure();
  }, [
    layout,
    colCount,
    scrollMargin,
    visible.length,
    gameId,
    cardSize,
    cardLayout.gridRowHeight,
    cardLayout.listRowHeight,
    virtualizer,
  ]);

  // Jump to match: widen filter to All if the hit is hidden by caught/missing.
  useEffect(() => {
    if (!search.activeKey) return;
    const inVisible = visible.some((s) => s.key === search.activeKey);
    if (!inVisible && filter !== 'all') {
      setFilter('all');
      return;
    }
    const slotIndex = visible.findIndex((s) => s.key === search.activeKey);
    if (slotIndex < 0) return;
    const rowIndex = layout === 'grid' ? Math.floor(slotIndex / colCount) : slotIndex;
    virtualizer.scrollToIndex(rowIndex, { align: 'center' });
  }, [search.activeKey, visible, filter, layout, colCount, virtualizer]);

  const selectableVisible = useMemo(() => visible.filter((s) => s.available !== false), [visible]);
  const visibleKeys = useMemo(() => selectableVisible.map((s) => s.key), [selectableVisible]);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someVisibleSelected = visibleKeys.some((k) => selected.has(k));
  const selectedCount = selected.size;

  function toggleSelected(key: string, next: boolean) {
    const slot = slots.find((s) => s.key === key);
    if (slot?.available === false) return;
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(key);
      else out.delete(key);
      return out;
    });
  }

  function toggleSelectAll(next: boolean) {
    setSelected((prev) => {
      const out = new Set(prev);
      for (const slot of visible) {
        if (slot.available === false) continue;
        if (next) out.add(slot.key);
        else out.delete(slot.key);
      }
      return out;
    });
  }

  function addSelected(options: GameAddOptions) {
    if (selectedCount === 0) return;
    const keys = Array.from(selected).filter((key) => {
      const slot = slots.find((s) => s.key === key);
      return slot?.available !== false;
    });
    if (keys.length === 0) return;
    applyGameAddOptions(gameId, keys, options, {
      setGameCaughtMany,
      setGameHomeMany,
    });
    setSelected(new Set());
    toast.success(
      keys.length === 1
        ? `Added 1 · ${summarizeGameAddOptions(options)}`
        : `Added ${keys.length} · ${summarizeGameAddOptions(options)}`,
    );
  }

  function removeSelected() {
    if (selectedCount === 0) return;
    const keys = Array.from(selected);
    setConfirm({
      title: selectedCount === 1 ? `Clear ${trackLabel}?` : `Clear ${selectedCount} ${trackLabel}?`,
      description:
        selectedCount === 1
          ? `This removes the ${trackLabel} mark in this game dex only.`
          : `This removes the ${trackLabel} mark for ${selectedCount} Pokémon in this game dex only.`,
      confirmLabel: 'Clear',
      onConfirm: () => {
        if (track === 'home') setGameHomeMany(gameId, keys, false);
        else setGameCaughtMany(gameId, keys, false);
        setSelected(new Set());
        toast.success(keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`);
      },
    });
  }

  if (!game) {
    return <p className="text-sm text-muted-foreground">No game data available.</p>;
  }

  const virtualItems = virtualizer.getVirtualItems();
  const progress = countGameProgress(game.boxes, trackMap);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {track === 'home' ? 'HOME from this game' : 'Caught in this game'}: {progress.caught}/{progress.total} (
        {progress.percent}%)
      </p>
      <div className={DEX_STICKY_TOOLBAR}>
        {visible.length > 0 ? (
          <>
            <Checkbox
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected && !allVisibleSelected}
              onCheckedChange={(v) => toggleSelectAll(v)}
              aria-label={selectedCount > 0 ? `Select all visible · ${selectedCount} selected` : 'Select all visible'}
            />
            <GameAddDialogButton
              selectedKeys={Array.from(selected)}
              disabled={selectedCount === 0}
              gameId={gameId}
              gameName={game.short || game.name}
              onAdd={addSelected}
            />
            <Button variant="outline" disabled={selectedCount === 0} onClick={removeSelected}>
              Clear
            </Button>
          </>
        ) : null}

        <DexSearchBar
          value={search.query}
          onChange={search.setQuery}
          matchCount={search.matches.length}
          activeIndex={search.activeIndex}
          onPrev={search.goPrev}
          onNext={search.goNext}
        />

        <GameFilterMenu value={filter} onChange={setFilter} track={track} />
        <GameTrackMenu value={track} onChange={setTrack} />

        <ToggleGroup
          variant="outline"
          spacing={0}
          value={[layout]}
          onValueChange={(next) => {
            const v = next[0] as typeof layout | undefined;
            if (v) setLayout(v);
          }}
          className="ml-auto justify-start"
          aria-label="Layout"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid">
            <LayoutGridIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" title="List">
            <ListIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {visible.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{filter === 'missing' ? 'Nothing missing' : 'No Pokémon here'}</EmptyTitle>
            <EmptyDescription>
              {filter === 'missing' ? 'This track is complete.' : 'Try another filter.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualItems.map((item) => {
            if (layout === 'list') {
              const slot = visible[item.index];
              return (
                <div
                  key={slot.key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full border-b border-border last:border-b-0"
                  style={{
                    transform: `translateY(${item.start - scrollMargin}px)`,
                  }}
                >
                  <GameDexRow
                    slot={slot}
                    gameId={gameId}
                    active={Boolean(trackMap[slot.key])}
                    inHome={Boolean(homeMap[slot.key])}
                    track={track}
                    selected={selected.has(slot.key)}
                    searchHit={search.hitKeys.has(slot.key)}
                    searchActive={search.activeKey === slot.key}
                    spriteStyle={spriteStyle}
                    cardSize={cardSize}
                    onSelectedChange={(v) => toggleSelected(slot.key, v)}
                  />
                </div>
              );
            }

            const start = item.index * colCount;
            const rowSlots = visible.slice(start, start + colCount);
            return (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 grid w-full gap-1.5 px-0.5 py-1 sm:gap-2"
                style={{
                  transform: `translateY(${item.start - scrollMargin}px)`,
                  gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                }}
              >
                {rowSlots.map((slot) => (
                  <GameDexGridCard
                    key={slot.key}
                    slot={slot}
                    gameId={gameId}
                    active={Boolean(trackMap[slot.key])}
                    inHome={Boolean(homeMap[slot.key])}
                    track={track}
                    selected={selected.has(slot.key)}
                    searchHit={search.hitKeys.has(slot.key)}
                    searchActive={search.activeKey === slot.key}
                    spriteStyle={spriteStyle}
                    cardSize={cardSize}
                    onSelectedChange={(v) => toggleSelected(slot.key, v)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmAlertDialog
        request={confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}

function formatDexEntry(n: number) {
  return `#${String(n).padStart(3, '0')}`;
}

/** Game dex # plus national # when they differ (easier cross-checking). */
function GameDexNumbers({ slot }: { slot: DexSlot }) {
  const entry = slot.entryNumber ?? slot.id;
  const showNational = slot.entryNumber != null && slot.entryNumber !== slot.id;
  return (
    <>
      <span className="font-semibold">{formatDexEntry(entry)}</span>
      {showNational ? <span className="font-normal text-muted-foreground"> · N{slot.id}</span> : null}
    </>
  );
}

function GameDexRow({
  slot,
  gameId,
  active,
  inHome,
  track,
  selected,
  searchHit,
  searchActive,
  spriteStyle,
  cardSize = 'medium',
  onSelectedChange,
}: {
  slot: DexSlot;
  gameId: GameId;
  active: boolean;
  inHome: boolean;
  track: GameTrack;
  selected: boolean;
  searchHit?: boolean;
  searchActive?: boolean;
  spriteStyle: SpriteStyle;
  cardSize?: CardSize;
  onSelectedChange: (selected: boolean) => void;
}) {
  const size = cardSizeConfig(cardSize);
  const unavailable = slot.available === false;
  const showHomeDot = track === 'caught' && inHome && !unavailable;
  const pokemonSearch = { from: 'games' as const, game: gameId };
  const variant = selected ? 'secondary' : active ? 'primary' : 'muted';
  const statusLabel = track === 'home' ? 'HOME' : 'Caught';

  return (
    <Item
      variant={variant}
      size="sm"
      className={cn(
        unavailable && 'opacity-70',
        searchActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        searchHit && !searchActive && !selected && 'ring-2 ring-ring/50 ring-offset-1 ring-offset-background',
      )}
    >
      <Checkbox
        checked={selected}
        disabled={unavailable}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
      />
      <ItemMedia>
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          formId={slot.formId}
          slug={slot.slug}
          width={size.spritePx}
          height={size.spritePx}
          className={cn(size.listSpriteClass, (!active || unavailable) && 'opacity-40 grayscale')}
        />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          <GameDexNumbers slot={slot} />
          <span className="inline-flex items-center gap-1.5">
            {slot.name}
            {showHomeDot ? (
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-600" title="In HOME" aria-label="In HOME" />
            ) : null}
          </span>
        </ItemTitle>
        {unavailable ? (
          <Badge variant="secondary">Unavailable</Badge>
        ) : active ? (
          <ItemDescription>{statusLabel}</ItemDescription>
        ) : null}
      </ItemContent>
      <Button
        variant="ghost"
        size="icon-xs"
        render={<Link to="/pokemon/$id" params={{ id: String(slot.id) }} search={pokemonSearch} />}
        nativeButton={false}
        aria-label={`${slot.name} details`}
      >
        <InfoIcon />
      </Button>
    </Item>
  );
}

function GameDexGridCard({
  slot,
  gameId,
  active,
  inHome,
  track,
  selected,
  searchHit,
  searchActive,
  spriteStyle,
  cardSize = 'medium',
  onSelectedChange,
}: {
  slot: DexSlot;
  gameId: GameId;
  active: boolean;
  inHome: boolean;
  track: GameTrack;
  selected: boolean;
  searchHit?: boolean;
  searchActive?: boolean;
  spriteStyle: SpriteStyle;
  cardSize?: CardSize;
  onSelectedChange: (selected: boolean) => void;
}) {
  const size = cardSizeConfig(cardSize);
  const unavailable = slot.available === false;
  const filled = active && !unavailable;
  const showHomeDot = track === 'caught' && inHome && !unavailable;
  const pokemonSearch = { from: 'games' as const, game: gameId };
  const variant = selected ? 'secondary' : filled ? 'primary' : 'muted';
  const statusWord = unavailable
    ? 'unavailable'
    : track === 'home'
      ? active
        ? 'in HOME'
        : 'not in HOME'
      : active
        ? inHome
          ? 'caught, in HOME'
          : 'caught'
        : 'missing';

  return (
    <div className="relative">
      <Checkbox
        checked={selected}
        disabled={unavailable}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
        className="absolute top-2 left-2 z-10"
      />
      <Item
        variant={variant}
        size="sm"
        render={
          <button
            type="button"
            disabled={unavailable}
            onClick={() => onSelectedChange(!selected)}
            aria-label={`${slot.name}: ${statusWord}. Tap to select.`}
            aria-pressed={selected}
          />
        }
        className={cn(
          'flex-col items-center',
          size.cardPadClass,
          searchActive && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
          searchHit && !searchActive && !selected && 'ring-2 ring-ring/50 ring-offset-1 ring-offset-background',
        )}
      >
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          formId={slot.formId}
          slug={slot.slug}
          width={size.spritePx}
          height={size.spritePx}
          className={cn(size.spriteClass, !filled && 'opacity-35 grayscale')}
        />
        <ItemContent className="w-full items-center text-center">
          <ItemTitle className="w-full justify-center tabular-nums">
            <GameDexNumbers slot={slot} />
          </ItemTitle>
          <ItemDescription className="inline-flex w-full items-center justify-center gap-1.5 text-center">
            {slot.name}
            {showHomeDot ? (
              <span className="size-1.5 shrink-0 rounded-full bg-emerald-600" title="In HOME" aria-hidden />
            ) : null}
          </ItemDescription>
          {unavailable ? <Badge variant="secondary">Unavailable</Badge> : null}
        </ItemContent>
      </Item>
      <Button
        variant="outline"
        size="icon-sm"
        className="absolute top-1 right-1 z-10"
        render={
          <Link
            to="/pokemon/$id"
            params={{ id: String(slot.id) }}
            search={pokemonSearch}
            aria-label={`${slot.name} details`}
            onClick={(e) => e.stopPropagation()}
          />
        }
        nativeButton={false}
      >
        <InfoIcon />
      </Button>
    </div>
  );
}
