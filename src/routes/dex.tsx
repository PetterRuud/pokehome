import { createFileRoute, Link } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Field, FieldContent, FieldTitle } from "@/components/ui/field";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  AddToSplitButton,
  applyAddToOptions,
  summarizeAddOptions,
  type AddToOptions,
} from "@/components/add-to-split-button";
import { DexSlotButton } from "@/components/dex-slot";
import { GameLogo } from "@/components/game-logo";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { applyBoxLayout } from "@/lib/box-layout";
import { useDexStore } from "@/lib/store";
import { countGameProgress, countProgress, isBoxComplete } from "@/lib/dex-stats";
import {
  filterBoxesForFormView,
  gmaxSpeciesCount,
  megaSpeciesCount,
} from "@/lib/form-variants";
import { getGame, getGames } from "@/lib/games";
import nationalDex from "@/data/national-dex.json";
import type { DexBox, DexSlot, FormView, GameId, SpriteStyle } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  ExpandIcon,
  EyeIcon,
  CheckCheckIcon,
  EraserIcon,
  GripVerticalIcon,
  InfoIcon,
  LayoutGridIcon,
  ListIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";

/** Sit under the app shell sticky header (h-14). */
const DEX_STICKY_TOOLBAR =
  "sticky top-14 z-30 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6";

const EMPTY_CAUGHT: Record<string, boolean> = {};
const LIST_ROW_HEIGHT = 104;
const GRID_ROW_HEIGHT = 148;

function useGridColumnCount(width: number) {
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  if (width >= 640) return 4;
  return 3;
}

const FORM_VIEW_OPTIONS: {
  value: FormView;
  label: string;
  icon: typeof SparklesIcon;
  className?: string;
}[] = [
  { value: "default", label: "All", icon: LayoutGridIcon },
  {
    value: "shiny",
    label: "Shiny",
    icon: SparklesIcon,
    className: "text-amber-500",
  },
  {
    value: "alpha",
    label: "Alpha",
    icon: EyeIcon,
    className: "text-red-500",
  },
  {
    value: "mega",
    label: "Mega",
    icon: ZapIcon,
    className: "text-violet-500",
  },
  {
    value: "gmax",
    label: "Gmax",
    icon: ExpandIcon,
    className: "text-rose-500",
  },
];

type DexSearch = {
  tab?: "national" | "games";
  game?: GameId;
};

export const Route = createFileRoute("/dex")({
  validateSearch: (search: Record<string, unknown>): DexSearch => {
    const tab = search.tab === "games" ? "games" : "national";
    const rawGame =
      typeof search.game === "string" && search.game.length > 0 ? search.game : undefined;
    const game = rawGame && getGame(rawGame) ? rawGame : undefined;
    return {
      tab,
      ...(game ? { game } : {}),
    };
  },
  component: DexPage,
});

function DexPage() {
  const collapseCompleted = useDexStore((s) => s.prefs.collapseCompleted);
  const setPref = useDexStore((s) => s.setPref);
  const caughtByGame = useDexStore((s) => s.caughtByGame);
  const games = getGames();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab = search.tab === "games" ? "games" : "national";
  const [gameId, setGameId] = useState<GameId>(
    () => (search.game && getGame(search.game)?.id) || games[0]?.id || "sv-paldea",
  );

  useEffect(() => {
    if (search.game && getGame(search.game)) {
      setGameId(search.game);
    }
  }, [search.game]);

  // Keep ?game= in sync when browsing the Games tab
  useEffect(() => {
    if (tab !== "games") return;
    if (search.game === gameId) return;
    void navigate({
      to: "/dex",
      search: { tab: "games", game: gameId },
      replace: true,
    });
  }, [tab, gameId, search.game, navigate]);

  function setTab(next: "national" | "games") {
    void navigate({
      to: "/dex",
      search: next === "games" ? { tab: "games", game: gameId } : { tab: "national" },
    });
  }

  function selectGame(id: GameId) {
    setGameId(id);
    void navigate({
      to: "/dex",
      search: { tab: "games", game: id },
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Living dex</h1>
          <p className="text-sm text-muted-foreground">
            National + HOME game / DLC dexes · select slots, then Add or Clear
          </p>
        </div>
        <Field orientation="horizontal" className="w-auto items-center">
          <FieldContent>
            <FieldTitle>Collapse completed</FieldTitle>
          </FieldContent>
          <Switch
            checked={collapseCompleted}
            onCheckedChange={(v) => setPref("collapseCompleted", v)}
          />
        </Field>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          if (v === "national" || v === "games") setTab(v);
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
              const { caught, total } = countGameProgress(game.boxes, caughtByGame[game.id]);
              const complete = total > 0 && caught === total;
              return (
                <ToggleGroupItem
                  key={game.id}
                  value={game.id}
                  aria-label={
                    complete
                      ? `${game.name}, complete`
                      : `${game.name}, ${caught} of ${total} caught`
                  }
                  title={game.name}
                  className={cn(
                    "h-auto min-w-0 flex-col gap-1.5 whitespace-normal px-2.5 py-2.5 data-[state=on]:bg-primary/10",
                    complete &&
                      "border-emerald-500/70 data-[state=on]:border-emerald-500 data-[state=on]:bg-emerald-500/10",
                  )}
                >
                  <GameLogo
                    logo={game.logo}
                    title={game.name}
                    variant="wordmark"
                    className="h-7 max-w-full"
                  />
                  <span className="flex max-w-full flex-wrap items-center justify-center gap-1">
                    <span className="text-center text-xs leading-tight font-medium">
                      {game.name}
                    </span>
                    {game.kind === "dlc" ? (
                      <Badge variant="secondary" className="shrink-0 text-[9px]">
                        DLC
                      </Badge>
                    ) : null}
                  </span>
                  {complete ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="size-3.5" aria-hidden />
                      Complete
                    </span>
                  ) : (
                    <span className="tabular-nums text-[10px] text-muted-foreground">
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
  const shinyByKey = useDexStore((s) => s.shinyByKey);
  const alphaByKey = useDexStore((s) => s.alphaByKey);
  const megaByKey = useDexStore((s) => s.megaByKey);
  const gmaxByKey = useDexStore((s) => s.gmaxByKey);
  const setCaughtMany = useDexStore((s) => s.setCaughtMany);
  const setShinyMany = useDexStore((s) => s.setShinyMany);
  const setAlphaMany = useDexStore((s) => s.setAlphaMany);
  const setMegaMany = useDexStore((s) => s.setMegaMany);
  const setGmaxMany = useDexStore((s) => s.setGmaxMany);
  const setGamesCaughtMany = useDexStore((s) => s.setGamesCaughtMany);
  const nationalBoxLayout = useDexStore((s) => s.nationalBoxLayout);
  const renameNationalBox = useDexStore((s) => s.renameNationalBox);
  const reorderNationalBoxes = useDexStore((s) => s.reorderNationalBoxes);
  const prefs = useDexStore((s) => s.prefs);
  const setPref = useDexStore((s) => s.setPref);
  const collapseCompleted = prefs.collapseCompleted;
  const formView = prefs.formView;
  const spriteStyle = prefs.spriteStyle;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const boxes = useMemo(() => {
    const laidOut = applyBoxLayout(
      nationalDex.boxes as DexBox[],
      nationalBoxLayout,
    );
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
    formView === "shiny"
      ? shinyByKey
      : formView === "alpha"
        ? alphaByKey
        : formView === "mega"
          ? megaByKey
          : formView === "gmax"
            ? gmaxByKey
            : null;

  const progressByKey = flagByKey ?? caughtByKey;

  const formProgress = useMemo(() => {
    if (formView === "default") {
      return countProgress(boxes, caughtByKey);
    }
    if (formView === "mega" || formView === "gmax") {
      return countProgress(boxes, flagByKey ?? {});
    }
    const flagged = Object.values(flagByKey ?? {}).filter(Boolean).length;
    const total = nationalDex.total;
    return {
      total,
      caught: flagged,
      percent: total === 0 ? 0 : Math.round((flagged / total) * 100),
    };
  }, [formView, boxes, caughtByKey, flagByKey]);

  const defaultOpen = boxes
    .filter((box) => !(collapseCompleted && isBoxComplete(box, progressByKey)))
    .slice(0, 3)
    .map((box) => box.id);

  const allKeys = useMemo(() => boxes.flatMap((box) => box.slots.map((s) => s.key)), [boxes]);
  const selectedCount = selected.size;
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));

  const trackLabel =
    formView === "default"
      ? "caught"
      : formView === "shiny"
        ? "shiny"
        : formView === "alpha"
          ? "alpha"
          : formView === "mega"
            ? "mega"
            : "gmax";

  function setMany(keys: string[], value: boolean) {
    if (formView === "shiny") setShinyMany(keys, value);
    else if (formView === "alpha") setAlphaMany(keys, value);
    else if (formView === "mega") setMegaMany(keys, value);
    else if (formView === "gmax") setGmaxMany(keys, value);
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
      setShinyMany,
      setAlphaMany,
      setMegaMany,
      setGmaxMany,
      setGamesCaughtMany,
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
    const label =
      selectedCount === 1
        ? `Clear ${trackLabel} for this Pokémon?`
        : `Clear ${trackLabel} for ${selectedCount} Pokémon?`;
    if (!window.confirm(label)) return;
    const keys = Array.from(selected);
    setMany(keys, false);
    setSelected(new Set());
    toast.success(
      keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`,
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={DEX_STICKY_TOOLBAR}>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onCheckedChange={(v) => toggleSelectAll(v)}
            aria-label="Select all"
          />
          <span className="text-muted-foreground">
            Select all
            {selectedCount > 0 ? ` · ${selectedCount}` : ""}
          </span>
        </label>
        <AddToSplitButton
          selectedCount={selectedCount}
          disabled={selectedCount === 0}
          onAdd={addSelected}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={selectedCount === 0}
          onClick={clearSelected}
        >
          Clear
        </Button>
        <ToggleGroup
          variant="outline"
          size="sm"
          value={[formView]}
          onValueChange={(next) => {
            const value = next[0] as FormView | undefined;
            if (value) setPref("formView", value);
          }}
          className="ml-auto flex flex-wrap justify-start"
          aria-label="Form view"
        >
          {FORM_VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <ToggleGroupItem
                key={opt.value}
                value={opt.value}
                aria-label={opt.label}
                title={opt.label}
                className="gap-1.5 px-2.5"
              >
                <Icon className={cn("size-3.5", opt.className)} />
                <span className="hidden text-xs sm:inline">{opt.label}</span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      <p className="text-sm text-muted-foreground">
        {formView === "mega"
          ? `Mega · ${formProgress.caught} / ${megaSpeciesCount()}`
          : formView === "gmax"
            ? `Gmax · ${formProgress.caught} / ${gmaxSpeciesCount()}`
            : formView === "shiny" || formView === "alpha"
              ? `${trackLabel} · ${formProgress.caught} marked`
              : `National · ${formProgress.caught} / ${formProgress.total}`}
        {" · select, then Add"}
      </p>

      <BoxAccordion
        boxes={boxes}
        caughtByKey={progressByKey}
        collapseCompleted={collapseCompleted}
        defaultOpen={defaultOpen}
        editable
        defaultTitles={defaultTitles}
        addAllLabel={formView === "default" ? "Add all" : `Mark all ${trackLabel}`}
        clearAllLabel={formView === "default" ? "Clear box" : `Clear ${trackLabel}`}
        onRename={(boxId, title) => renameNationalBox(boxId, title, defaultTitles[boxId] ?? title)}
        onReorder={(fromId, toId) =>
          reorderNationalBoxes(
            fromId,
            toId,
            boxes.map((b) => b.id),
          )
        }
        onAddAll={(keys) => {
          setMany(keys, true);
          toast.success(
            keys.length === 1 ? `Marked 1 ${trackLabel}` : `Marked ${keys.length} ${trackLabel}`,
          );
        }}
        onClearAll={(keys) => {
          const label =
            keys.length === 1
              ? `Clear ${trackLabel} for this Pokémon?`
              : `Clear ${trackLabel} for all ${keys.length} in this box?`;
          if (!window.confirm(label)) return;
          setMany(keys, false);
          toast.success(
            keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`,
          );
        }}
        renderSlot={(slot) => (
          <DexSlotButton
            key={slot.key}
            slot={slot}
            caught={Boolean(caughtByKey[slot.key])}
            formView={formView}
            flagged={Boolean(flagByKey?.[slot.key])}
            spriteStyle={spriteStyle}
            selected={selected.has(slot.key)}
            onSelectedChange={(next) => toggleSelected(slot.key, next)}
          />
        )}
      />
    </div>
  );
}

function GameDexView({ gameId }: { gameId: GameId }) {
  const game = getGame(gameId);
  const caughtMap = useDexStore((s) => s.caughtByGame[gameId] ?? EMPTY_CAUGHT);
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);
  const setGameCaughtMany = useDexStore((s) => s.setGameCaughtMany);
  const [filter, setFilter] = useState<"missing" | "caught" | "all">("all");
  const [layout, setLayout] = useState<"list" | "grid">("grid");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    setSelected(new Set());
  }, [gameId, filter]);

  const slots = useMemo(() => game?.boxes.flatMap((box) => box.slots) ?? [], [game]);

  const visible = useMemo(() => {
    if (filter === "all") return slots;
    if (filter === "caught") return slots.filter((s) => caughtMap[s.key]);
    return slots.filter((s) => !caughtMap[s.key]);
  }, [slots, filter, caughtMap]);

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
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [layout, gameId, visible.length]);

  const colCount = useGridColumnCount(scrollWidth);
  const rowCount = layout === "grid" ? Math.ceil(visible.length / colCount) : visible.length;

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => (layout === "list" ? LIST_ROW_HEIGHT : GRID_ROW_HEIGHT),
    overscan: 8,
    scrollMargin,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [layout, colCount, scrollMargin, virtualizer]);

  const visibleKeys = useMemo(() => visible.map((s) => s.key), [visible]);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someVisibleSelected = visibleKeys.some((k) => selected.has(k));
  const selectedCount = selected.size;

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
      for (const key of visibleKeys) {
        if (next) out.add(key);
        else out.delete(key);
      }
      return out;
    });
  }

  function addSelected() {
    if (selectedCount === 0) return;
    const keys = Array.from(selected);
    setGameCaughtMany(gameId, keys, true);
    setSelected(new Set());
    toast.success(keys.length === 1 ? "Marked 1 as caught" : `Marked ${keys.length} as caught`);
  }

  function removeSelected() {
    if (selectedCount === 0) return;
    const label =
      selectedCount === 1
        ? "Remove this Pokémon from the dex?"
        : `Remove ${selectedCount} Pokémon from the dex?`;
    if (!window.confirm(label)) return;
    const keys = Array.from(selected);
    setGameCaughtMany(gameId, keys, false);
    setSelected(new Set());
    toast.success(keys.length === 1 ? "Removed 1" : `Removed ${keys.length}`);
  }

  if (!game) {
    return <p className="text-sm text-muted-foreground">No game data available.</p>;
  }

  const { caught, total, percent } = countGameProgress(game.boxes, caughtMap);
  const missingCount = total - caught;
  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col gap-3">
      <div className={DEX_STICKY_TOOLBAR}>
        {visible.length > 0 ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onCheckedChange={(v) => toggleSelectAll(v)}
                aria-label="Select all visible"
              />
              <span className="text-muted-foreground">
                Select all
                {selectedCount > 0 ? ` · ${selectedCount}` : ""}
              </span>
            </label>
            <Button
              size="sm"
              variant="secondary"
              disabled={selectedCount === 0}
              onClick={addSelected}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0}
              onClick={removeSelected}
            >
              Clear
            </Button>
          </>
        ) : null}

        <ToggleGroup
          variant="outline"
          size="sm"
          value={[filter]}
          onValueChange={(next) => {
            const v = next[0] as typeof filter | undefined;
            if (v) setFilter(v);
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="missing">Missing</ToggleGroupItem>
          <ToggleGroupItem value="caught">Caught</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          variant="outline"
          size="sm"
          value={[layout]}
          onValueChange={(next) => {
            const v = next[0] as typeof layout | undefined;
            if (v) setLayout(v);
          }}
          className="ml-auto justify-start"
          aria-label="Layout"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid">
            <LayoutGridIcon className="size-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" title="List">
            <ListIcon className="size-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {caught}/{total} · {percent}%
        </Badge>
        {missingCount > 0 ? (
          <Badge variant="secondary">{missingCount} missing</Badge>
        ) : (
          <Badge variant="secondary">Complete</Badge>
        )}
        {game.kind === "dlc" ? <Badge variant="secondary">DLC</Badge> : null}
      </div>

      {visible.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>{filter === "missing" ? "Nothing missing" : "No Pokémon here"}</EmptyTitle>
            <EmptyDescription>
              {filter === "missing" ? "This dex is complete." : "Try another filter."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          ref={listRef}
          className="relative w-full rounded-lg border border-border"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((item) => {
            if (layout === "list") {
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
                    caught={Boolean(caughtMap[slot.key])}
                    selected={selected.has(slot.key)}
                    spriteStyle={spriteStyle}
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
                className="absolute top-0 left-0 grid w-full gap-2 px-2 py-1"
                style={{
                  transform: `translateY(${item.start - scrollMargin}px)`,
                  gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                }}
              >
                {rowSlots.map((slot) => (
                  <GameDexGridCard
                    key={slot.key}
                    slot={slot}
                    caught={Boolean(caughtMap[slot.key])}
                    selected={selected.has(slot.key)}
                    spriteStyle={spriteStyle}
                    onSelectedChange={(v) => toggleSelected(slot.key, v)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GameDexRow({
  slot,
  caught,
  selected,
  spriteStyle,
  onSelectedChange,
}: {
  slot: DexSlot;
  caught: boolean;
  selected: boolean;
  spriteStyle: SpriteStyle;
  onSelectedChange: (selected: boolean) => void;
}) {
  const entry = slot.entryNumber ?? slot.id;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:py-3",
        !caught && "bg-muted/40",
        selected && "bg-primary/10",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
      />
      <PokemonSprite
        id={slot.id}
        style={spriteStyle}
        width={72}
        height={72}
        className={cn("size-[4.5rem] shrink-0 sm:size-20", !caught && "opacity-40 grayscale")}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium">
          <span className="mr-1.5 tabular-nums text-muted-foreground">
            #{String(entry).padStart(3, "0")}
          </span>
          {slot.name}
        </p>
        {caught ? <p className="text-xs text-muted-foreground">Caught</p> : null}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        render={<Link to="/pokemon/$id" params={{ id: String(slot.id) }} />}
        nativeButton={false}
        aria-label={`${slot.name} details`}
      >
        <InfoIcon className="size-3.5" />
      </Button>
    </div>
  );
}

function GameDexGridCard({
  slot,
  caught,
  selected,
  spriteStyle,
  onSelectedChange,
}: {
  slot: DexSlot;
  caught: boolean;
  selected: boolean;
  spriteStyle: SpriteStyle;
  onSelectedChange: (selected: boolean) => void;
}) {
  const entry = slot.entryNumber ?? slot.id;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-md border-2 p-1.5 pt-7 transition",
        !caught && "border-border/60 bg-muted/80 text-muted-foreground",
        caught && !selected && "border-primary/50 bg-primary/10 text-foreground",
        selected &&
          "border-primary bg-primary/15 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]",
      )}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
        className="absolute top-1.5 left-1.5"
      />
      <Link
        to="/pokemon/$id"
        params={{ id: String(slot.id) }}
        aria-label={`${slot.name} details`}
        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition hover:text-foreground"
      >
        <InfoIcon className="size-3.5" />
      </Link>
      <button
        type="button"
        onClick={() => onSelectedChange(!selected)}
        className="flex w-full flex-col items-center gap-1"
      >
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          width={72}
          height={72}
          className={cn("size-14 sm:size-16", !caught && "opacity-40 grayscale")}
        />
        <span className="w-full truncate text-center text-[10px] font-medium leading-tight sm:text-xs">
          <span className="tabular-nums text-muted-foreground">
            #{String(entry).padStart(3, "0")}{" "}
          </span>
          {slot.name}
        </span>
      </button>
    </div>
  );
}

function BoxAccordion({
  boxes,
  caughtByKey,
  collapseCompleted,
  defaultOpen,
  renderSlot,
  editable = false,
  defaultTitles,
  addAllLabel = "Add all",
  clearAllLabel = "Clear box",
  onRename,
  onReorder,
  onAddAll,
  onClearAll,
}: {
  boxes: DexBox[];
  caughtByKey: Record<string, boolean>;
  collapseCompleted: boolean;
  defaultOpen: string[];
  renderSlot: (slot: DexBox["slots"][number]) => React.ReactNode;
  editable?: boolean;
  defaultTitles?: Record<string, string>;
  addAllLabel?: string;
  clearAllLabel?: string;
  onRename?: (boxId: string, title: string) => void;
  onReorder?: (fromId: string, toId: string) => void;
  onAddAll?: (keys: string[]) => void;
  onClearAll?: (keys: string[]) => void;
}) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [renameBox, setRenameBox] = useState<DexBox | null>(null);
  const [renameValue, setRenameValue] = useState("");

  return (
    <>
      <Accordion multiple defaultValue={defaultOpen}>
        {boxes.map((box) => {
          const complete = isBoxComplete(box, caughtByKey);
          const caughtCount = box.slots.filter((s) => Boolean(caughtByKey[s.key])).length;
          const keys = box.slots.map((s) => s.key);
          const missing = keys.filter((k) => !caughtByKey[k]);

          return (
            <AccordionItem
              key={box.id}
              value={box.id}
              className={cn(dragOverId === box.id && "rounded-lg ring-2 ring-ring/60")}
              onDragOver={
                editable && onReorder
                  ? (e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverId(box.id);
                    }
                  : undefined
              }
              onDragLeave={
                editable
                  ? () => {
                      setDragOverId((id) => (id === box.id ? null : id));
                    }
                  : undefined
              }
              onDrop={
                editable && onReorder
                  ? (e) => {
                      e.preventDefault();
                      const fromId = e.dataTransfer.getData("text/box-id");
                      setDragOverId(null);
                      if (fromId) onReorder(fromId, box.id);
                    }
                  : undefined
              }
            >
              <AccordionHeader className="px-1">
                {editable && onReorder ? (
                  <button
                    type="button"
                    draggable
                    aria-label={`Reorder ${box.title}`}
                    title="Drag to reorder"
                    className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
                    onClick={(e) => e.preventDefault()}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/box-id", box.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragOverId(null)}
                  >
                    <GripVerticalIcon className="size-4" />
                  </button>
                ) : null}

                <AccordionTrigger className="min-w-0 hover:no-underline">
                  <span className="flex min-w-0 flex-wrap items-center gap-2 text-left">
                    <span className="font-semibold">{box.title}</span>
                    <span className="text-xs text-muted-foreground">{box.rangeLabel}</span>
                    {collapseCompleted && complete ? (
                      <Badge variant="secondary">Complete</Badge>
                    ) : (
                      <>
                        <Badge variant="outline">
                          {caughtCount}/{box.slots.length}
                        </Badge>
                        {complete ? <Badge variant="secondary">Done</Badge> : null}
                      </>
                    )}
                  </span>
                </AccordionTrigger>

                {onAddAll || onClearAll || (editable && onRename) ? (
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
                        {onAddAll && !complete ? (
                          <DropdownMenuItem
                            disabled={missing.length === 0}
                            onClick={() => onAddAll(missing.length > 0 ? missing : keys)}
                          >
                            <CheckCheckIcon />
                            {addAllLabel}
                          </DropdownMenuItem>
                        ) : null}
                        {onClearAll && caughtCount > 0 ? (
                          <DropdownMenuItem variant="destructive" onClick={() => onClearAll(keys)}>
                            <EraserIcon />
                            {clearAllLabel}
                          </DropdownMenuItem>
                        ) : null}
                        {editable && onRename ? (
                          <>
                            {(onAddAll && !complete) || (onClearAll && caughtCount > 0) ? (
                              <DropdownMenuSeparator />
                            ) : null}
                            <DropdownMenuItem
                              onClick={() => {
                                setRenameBox(box);
                                setRenameValue(box.title);
                              }}
                            >
                              <PencilIcon />
                              Rename
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </AccordionHeader>

              <AccordionContent>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2 md:grid-cols-6 md:gap-2.5">
                  {box.slots.map((slot) => renderSlot(slot))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

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
              {renameBox ? ` (“${defaultTitles?.[renameBox.id] ?? renameBox.title}”).` : "."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="box-rename">Name</Label>
            <Input
              id="box-rename"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameBox && onRename) {
                  onRename(renameBox.id, renameValue);
                  setRenameBox(null);
                  toast.success("Box renamed");
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameBox(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!renameBox || !onRename) return;
                onRename(renameBox.id, renameValue);
                setRenameBox(null);
                toast.success("Box renamed");
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
