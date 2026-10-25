import { createFileRoute, Link } from "@tanstack/react-router";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  AddToDialogButton,
  applyAddToOptions,
  summarizeAddOptions,
  type AddToOptions,
} from "@/components/add-to-dialog";
import {
  ConfirmAlertDialog,
  type ConfirmRequest,
} from "@/components/confirm-alert-dialog";
import { DexSlotButton } from "@/components/dex-slot";
import { GameLogo } from "@/components/game-logo";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { applyBoxLayout } from "@/lib/box-layout";
import { useDexStore } from "@/lib/store";
import { countGameProgress, countProgress } from "@/lib/dex-stats";
import {
  filterBoxesForFormView,
  gmaxSpeciesCount,
  megaSpeciesCount,
  regionalSpeciesCount,
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
  GlobeIcon,
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
const NAT_HEADER_HEIGHT = 44;
const NAT_GRID_ROW_HEIGHT = 136;

type NationalVirtualRow =
  | {
      type: "header";
      box: DexBox;
      caughtCount: number;
      complete: boolean;
      keys: string[];
      missing: string[];
    }
  | { type: "grid"; boxId: string; slots: DexSlot[] };

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
  {
    value: "regional",
    label: "Regional",
    icon: GlobeIcon,
    className: "text-sky-500",
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
      <h1 className="text-2xl font-bold tracking-tight">Living dex</h1>

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
                      <Badge variant="secondary" className="shrink-0">
                        DLC
                      </Badge>
                    ) : null}
                  </span>
                  {complete ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckIcon className="size-3.5" aria-hidden />
                      Complete
                    </span>
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
  const shinyByKey = useDexStore((s) => s.shinyByKey);
  const alphaByKey = useDexStore((s) => s.alphaByKey);
  const megaByKey = useDexStore((s) => s.megaByKey);
  const gmaxByKey = useDexStore((s) => s.gmaxByKey);
  const regionalByKey = useDexStore((s) => s.regionalByKey);
  const setCaughtMany = useDexStore((s) => s.setCaughtMany);
  const setShinyMany = useDexStore((s) => s.setShinyMany);
  const setAlphaMany = useDexStore((s) => s.setAlphaMany);
  const setMegaMany = useDexStore((s) => s.setMegaMany);
  const setGmaxMany = useDexStore((s) => s.setGmaxMany);
  const setRegionalMany = useDexStore((s) => s.setRegionalMany);
  const setGamesCaughtMany = useDexStore((s) => s.setGamesCaughtMany);
  const nationalBoxLayout = useDexStore((s) => s.nationalBoxLayout);
  const renameNationalBox = useDexStore((s) => s.renameNationalBox);
  const prefs = useDexStore((s) => s.prefs);
  const setPref = useDexStore((s) => s.setPref);
  const formView = prefs.formView;
  const spriteStyle = prefs.spriteStyle;
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [renameBox, setRenameBox] = useState<DexBox | null>(null);
  const [renameValue, setRenameValue] = useState("");
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
    formView === "shiny"
      ? shinyByKey
      : formView === "alpha"
        ? alphaByKey
        : formView === "mega"
          ? megaByKey
          : formView === "gmax"
            ? gmaxByKey
            : formView === "regional"
              ? regionalByKey
              : null;

  const progressByKey = flagByKey ?? caughtByKey;

  const formProgress = useMemo(() => {
    if (formView === "default") {
      return countProgress(boxes, caughtByKey);
    }
    if (formView === "mega" || formView === "gmax" || formView === "regional") {
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

  const trackLabel =
    formView === "default"
      ? "caught"
      : formView === "shiny"
        ? "shiny"
        : formView === "alpha"
          ? "alpha"
          : formView === "mega"
            ? "mega"
            : formView === "gmax"
              ? "gmax"
              : "regional";

  const allKeys = useMemo(
    () => boxes.flatMap((box) => box.slots.map((s) => s.key)),
    [boxes],
  );
  const selectedCount = selected.size;
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const someSelected = allKeys.some((k) => selected.has(k));

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
  }, [boxes.length, formView]);

  const colCount = useGridColumnCount(scrollWidth);

  const virtualRows = useMemo(() => {
    const rows: NationalVirtualRow[] = [];
    for (const box of boxes) {
      const keys = box.slots.map((s) => s.key);
      const caughtCount = keys.filter((k) => Boolean(progressByKey[k])).length;
      const complete = caughtCount === keys.length && keys.length > 0;
      rows.push({
        type: "header",
        box,
        caughtCount,
        complete,
        keys,
        missing: keys.filter((k) => !progressByKey[k]),
      });
      for (let i = 0; i < box.slots.length; i += colCount) {
        rows.push({
          type: "grid",
          boxId: box.id,
          slots: box.slots.slice(i, i + colCount),
        });
      }
    }
    return rows;
  }, [boxes, progressByKey, colCount]);

  const virtualizer = useWindowVirtualizer({
    count: virtualRows.length,
    estimateSize: (index) =>
      virtualRows[index]?.type === "header" ? NAT_HEADER_HEIGHT : NAT_GRID_ROW_HEIGHT,
    overscan: 6,
    scrollMargin,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [colCount, scrollMargin, virtualRows.length, virtualizer]);

  function setMany(keys: string[], value: boolean) {
    if (formView === "shiny") setShinyMany(keys, value);
    else if (formView === "alpha") setAlphaMany(keys, value);
    else if (formView === "mega") setMegaMany(keys, value);
    else if (formView === "gmax") setGmaxMany(keys, value);
    else if (formView === "regional") setRegionalMany(keys, value);
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
      setRegionalMany,
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
    const keys = Array.from(selected);
    setConfirm({
      title: selectedCount === 1 ? `Clear ${trackLabel}?` : `Clear ${selectedCount} ${trackLabel}?`,
      description:
        selectedCount === 1
          ? `This removes the ${trackLabel} mark for the selected Pokémon.`
          : `This removes the ${trackLabel} mark for ${selectedCount} selected Pokémon.`,
      confirmLabel: "Clear",
      onConfirm: () => {
        setMany(keys, false);
        setSelected(new Set());
        toast.success(
          keys.length === 1 ? `Cleared 1 ${trackLabel}` : `Cleared ${keys.length} ${trackLabel}`,
        );
      },
    });
  }

  const virtualItems = virtualizer.getVirtualItems();

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
        <AddToDialogButton
          selectedCount={selectedCount}
          disabled={selectedCount === 0}
          onAdd={addSelected}
        />
        <Button size="sm" variant="outline" disabled={selectedCount === 0} onClick={clearSelected}>
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
            : formView === "regional"
              ? `Regional · ${formProgress.caught} / ${regionalSpeciesCount()}`
              : formView === "shiny" || formView === "alpha"
                ? `${trackLabel} · ${formProgress.caught} marked`
                : `National · ${formProgress.caught} / ${formProgress.total}`}
      </p>

      {boxes.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No Pokémon here</EmptyTitle>
            <EmptyDescription>Try another form view.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div
          ref={listRef}
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualItems.map((item) => {
            const row = virtualRows[item.index];
            if (!row) return null;

            if (row.type === "header") {
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
                    addAllLabel={formView === "default" ? "Add all" : `Mark all ${trackLabel}`}
                    clearAllLabel={formView === "default" ? "Clear box" : `Clear ${trackLabel}`}
                    onRename={() => {
                      setRenameBox(row.box);
                      setRenameValue(row.box.title);
                    }}
                    onAddAll={() => {
                      const keys = row.missing.length > 0 ? row.missing : row.keys;
                      setMany(keys, true);
                      toast.success(
                        keys.length === 1
                          ? `Marked 1 ${trackLabel}`
                          : `Marked ${keys.length} ${trackLabel}`,
                      );
                    }}
                    onClearAll={() => {
                      const keys = row.keys;
                      setConfirm({
                        title:
                          keys.length === 1
                            ? `Clear ${trackLabel}?`
                            : `Clear box ${trackLabel}?`,
                        description:
                          keys.length === 1
                            ? `This removes the ${trackLabel} mark for this Pokémon.`
                            : `This removes the ${trackLabel} mark for all ${keys.length} Pokémon in this box.`,
                        confirmLabel: "Clear",
                        onConfirm: () => {
                          setMany(keys, false);
                          toast.success(
                            keys.length === 1
                              ? `Cleared 1 ${trackLabel}`
                              : `Cleared ${keys.length} ${trackLabel}`,
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
                    selected={selected.has(slot.key)}
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
              {renameBox ? ` (“${defaultTitles[renameBox.id] ?? renameBox.title}”).` : "."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="box-rename">Name</Label>
            <Input
              id="box-rename"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameBox) {
                  renameNationalBox(
                    renameBox.id,
                    renameValue,
                    defaultTitles[renameBox.id] ?? renameBox.title,
                  );
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
                if (!renameBox) return;
                renameNationalBox(
                  renameBox.id,
                  renameValue,
                  defaultTitles[renameBox.id] ?? renameBox.title,
                );
                setRenameBox(null);
                toast.success("Box renamed");
              }}
            >
              Save
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
    <div className="flex items-center gap-1 border-b border-border bg-background/80 px-1 py-1.5 backdrop-blur">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pl-1">
        <span className="truncate font-semibold">{box.title}</span>
        <span className="text-xs text-muted-foreground">{box.rangeLabel}</span>
        <Badge variant="outline">
          {caughtCount}/{box.slots.length}
        </Badge>
        {complete ? <Badge variant="secondary">Done</Badge> : null}
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
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);
  const setGameCaughtMany = useDexStore((s) => s.setGameCaughtMany);
  const [filter, setFilter] = useState<"missing" | "caught" | "all">("all");
  const [layout, setLayout] = useState<"list" | "grid">("grid");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    setSelected(new Set());
  }, [gameId, filter]);

  const slots = useMemo(() => game?.boxes.flatMap((box) => box.slots) ?? [], [game]);

  const visible = useMemo(() => {
    if (filter === "all") return slots;
    if (filter === "caught") {
      return slots.filter((s) => s.available !== false && caughtMap[s.key]);
    }
    // Missing: obtainable but not caught (skip unreleased)
    return slots.filter((s) => s.available !== false && !caughtMap[s.key]);
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

  const selectableVisible = useMemo(
    () => visible.filter((s) => s.available !== false),
    [visible],
  );
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

  function addSelected() {
    if (selectedCount === 0) return;
    const keys = Array.from(selected).filter((key) => {
      const slot = slots.find((s) => s.key === key);
      return slot?.available !== false;
    });
    if (keys.length === 0) return;
    setGameCaughtMany(gameId, keys, true);
    setSelected(new Set());
    toast.success(keys.length === 1 ? "Marked 1 as caught" : `Marked ${keys.length} as caught`);
  }

  function removeSelected() {
    if (selectedCount === 0) return;
    const keys = Array.from(selected);
    setConfirm({
      title:
        selectedCount === 1
          ? "Clear from this dex?"
          : `Clear ${selectedCount} from this dex?`,
      description:
        selectedCount === 1
          ? "This unmarks the selected Pokémon in this game dex only."
          : `This unmarks ${selectedCount} Pokémon in this game dex only.`,
      confirmLabel: "Clear",
      onConfirm: () => {
        setGameCaughtMany(gameId, keys, false);
        setSelected(new Set());
        toast.success(keys.length === 1 ? "Removed 1" : `Removed ${keys.length}`);
      },
    });
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
                    gameId={gameId}
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
                    gameId={gameId}
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
  return `#${String(n).padStart(3, "0")}`;
}

/** Game dex # plus national # when they differ (easier cross-checking). */
function GameDexNumbers({ slot }: { slot: DexSlot }) {
  const entry = slot.entryNumber ?? slot.id;
  const showNational = slot.entryNumber != null && slot.entryNumber !== slot.id;
  return (
    <span className="tabular-nums">
      <span className="font-semibold text-foreground">{formatDexEntry(entry)}</span>
      {showNational ? (
        <span className="text-muted-foreground"> · N{slot.id}</span>
      ) : null}
    </span>
  );
}

function GameDexRow({
  slot,
  gameId,
  caught,
  selected,
  spriteStyle,
  onSelectedChange,
}: {
  slot: DexSlot;
  gameId: GameId;
  caught: boolean;
  selected: boolean;
  spriteStyle: SpriteStyle;
  onSelectedChange: (selected: boolean) => void;
}) {
  const unavailable = slot.available === false;
  const pokemonSearch = { from: "games" as const, game: gameId };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:py-3",
        !caught && "bg-muted/40",
        selected && "bg-primary/10",
        unavailable && "opacity-70",
      )}
    >
      <Checkbox
        checked={selected}
        disabled={unavailable}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
      />
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          formId={slot.formId}
          slug={slot.slug}
          width={72}
          height={72}
          className={cn(
            "size-[4.5rem] shrink-0 sm:size-20",
            (!caught || unavailable) && "opacity-40 grayscale",
          )}
        />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium">
          <GameDexNumbers slot={slot} />
          <span className="ml-1.5">{slot.name}</span>
        </p>
        {unavailable ? (
          <Badge variant="secondary" className="mt-0.5">
            Unavailable
          </Badge>
        ) : caught ? (
          <p className="text-xs text-muted-foreground">Caught</p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        render={
          <Link
            to="/pokemon/$id"
            params={{ id: String(slot.id) }}
            search={pokemonSearch}
          />
        }
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
  gameId,
  caught,
  selected,
  spriteStyle,
  onSelectedChange,
}: {
  slot: DexSlot;
  gameId: GameId;
  caught: boolean;
  selected: boolean;
  spriteStyle: SpriteStyle;
  onSelectedChange: (selected: boolean) => void;
}) {
  const unavailable = slot.available === false;
  const pokemonSearch = { from: "games" as const, game: gameId };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-md border-2 p-1.5 pt-7 transition",
        (!caught || unavailable) && "border-border/60 bg-muted/80 text-muted-foreground",
        caught &&
          !unavailable &&
          !selected &&
          "border-primary/50 bg-primary/10 text-foreground",
        selected &&
          !unavailable &&
          "border-primary bg-primary/15 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]",
      )}
    >
      <Checkbox
        checked={selected}
        disabled={unavailable}
        onCheckedChange={(v) => onSelectedChange(v === true)}
        aria-label={`Select ${slot.name}`}
        className="absolute top-1.5 left-1.5"
      />
      <Link
        to="/pokemon/$id"
        params={{ id: String(slot.id) }}
        search={pokemonSearch}
        aria-label={`${slot.name} details`}
        className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-sm transition hover:text-foreground"
      >
        <InfoIcon className="size-3.5" />
      </Link>
      <button
        type="button"
        disabled={unavailable}
        onClick={() => onSelectedChange(!selected)}
        className="flex w-full flex-col items-center gap-1 disabled:pointer-events-none"
      >
        <PokemonSprite
          id={slot.id}
          style={spriteStyle}
          formId={slot.formId}
          slug={slot.slug}
          width={72}
          height={72}
          className={cn(
            "size-14 sm:size-16",
            (!caught || unavailable) && "opacity-40 grayscale",
          )}
        />
        <span className="w-full truncate text-center text-xs leading-tight">
          <GameDexNumbers slot={slot} />
        </span>
        <span className="w-full truncate text-center text-xs font-medium leading-tight">
          {slot.name}
        </span>
        {unavailable ? (
          <Badge variant="secondary" className="max-w-full truncate">
            Unavailable
          </Badge>
        ) : null}
      </button>
    </div>
  );
}
