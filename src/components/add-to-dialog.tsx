import { useMemo, useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { canGmax, canMega, canRegional } from '@/lib/form-variants';
import { getGameGroups, getGames } from '@/lib/games';
import { useDexStore } from '@/lib/store';
import type { GameId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckIcon, ExpandIcon, EyeIcon, GlobeIcon, HomeIcon, SparklesIcon, ZapIcon } from 'lucide-react';

/** Explicit on/off, or mixed (leave each Pokémon unchanged). */
export type TriState = boolean | 'indeterminate';

export type AddStatuses = {
  caught: TriState;
  home: TriState;
  shiny: TriState;
  alpha: TriState;
  mega: TriState;
  gmax: TriState;
  regional: TriState;
};

export type AddToOptions = {
  statuses: AddStatuses;
  /** Per-game caught mark. Missing / indeterminate → leave unchanged. */
  games: Partial<Record<GameId, TriState>>;
};

function aggregateFlag(keys: string[], map: Record<string, boolean> | undefined): TriState {
  if (keys.length === 0) return false;
  let any = false;
  let all = true;
  for (const key of keys) {
    if (map?.[key]) any = true;
    else all = false;
  }
  if (all) return true;
  if (!any) return false;
  return 'indeterminate';
}

const DEFAULT_OPTIONS: AddToOptions = {
  statuses: {
    caught: true,
    home: false,
    shiny: false,
    alpha: false,
    mega: false,
    gmax: false,
    regional: false,
  },
  games: {},
};

export function parseNationalId(key: string): number {
  const match = /^n(\d+)/.exec(key);
  return match ? Number(match[1]) : Number.NaN;
}

function applyTriState(state: TriState | undefined, keys: string[], setMany: (keys: string[], value: boolean) => void) {
  if (state === undefined || state === 'indeterminate' || keys.length === 0) return;
  setMany(keys, state);
}

/** Apply status + game marks for the given keys. Indeterminate values are left alone. */
export function applyAddToOptions(
  keys: string[],
  options: AddToOptions,
  actions: {
    setCaughtMany: (keys: string[], value: boolean) => void;
    setHomeMany: (keys: string[], value: boolean) => void;
    setShinyMany: (keys: string[], value: boolean) => void;
    setAlphaMany: (keys: string[], value: boolean) => void;
    setMegaMany: (keys: string[], value: boolean) => void;
    setGmaxMany: (keys: string[], value: boolean) => void;
    setRegionalMany: (keys: string[], value: boolean) => void;
    setGamesCaughtMany: (gameIds: GameId[], keys: string[], value: boolean) => void;
    setGamesHomeMany: (gameIds: GameId[], keys: string[], value: boolean) => void;
  },
) {
  const { statuses, games } = options;
  applyTriState(statuses.caught, keys, actions.setCaughtMany);
  applyTriState(statuses.home, keys, actions.setHomeMany);
  applyTriState(statuses.shiny, keys, actions.setShinyMany);
  applyTriState(statuses.alpha, keys, actions.setAlphaMany);

  if (statuses.mega !== 'indeterminate') {
    const megaKeys = keys.filter((key) => canMega(parseNationalId(key)));
    applyTriState(statuses.mega, megaKeys, actions.setMegaMany);
  }
  if (statuses.gmax !== 'indeterminate') {
    const gmaxKeys = keys.filter((key) => canGmax(parseNationalId(key)));
    applyTriState(statuses.gmax, gmaxKeys, actions.setGmaxMany);
  }
  if (statuses.regional !== 'indeterminate') {
    const regionalKeys = keys.filter((key) => canRegional(parseNationalId(key)));
    applyTriState(statuses.regional, regionalKeys, actions.setRegionalMany);
  }

  // Only entries present in `games` are written; omitted games stay unchanged.
  const markHome = statuses.home;
  for (const [gameId, state] of Object.entries(games) as [GameId, TriState][]) {
    if (state === 'indeterminate') continue;
    actions.setGamesCaughtMany([gameId], keys, state);
    if (state === false) {
      actions.setGamesHomeMany([gameId], keys, false);
    } else if (markHome === true) {
      actions.setGamesHomeMany([gameId], keys, true);
    } else if (markHome === false) {
      actions.setGamesHomeMany([gameId], keys, false);
    }
  }
}

export type GameAddOptions = {
  gameCaught: TriState;
  gameHome: TriState;
};

const DEFAULT_GAME_OPTIONS: GameAddOptions = {
  gameCaught: true,
  gameHome: false,
};

export function applyGameAddOptions(
  gameId: GameId,
  keys: string[],
  options: GameAddOptions,
  actions: {
    setGameCaughtMany: (gameId: GameId, keys: string[], value: boolean) => void;
    setGameHomeMany: (gameId: GameId, keys: string[], value: boolean) => void;
  },
) {
  if (options.gameCaught !== 'indeterminate') {
    actions.setGameCaughtMany(gameId, keys, options.gameCaught);
  }
  if (options.gameHome !== 'indeterminate') {
    actions.setGameHomeMany(gameId, keys, options.gameHome);
  }
}

function summarizeTri(label: string, state: TriState | undefined, parts: string[]) {
  if (state === true) parts.push(label);
  else if (state === false) parts.push(`−${label}`);
}

export function summarizeGameAddOptions(options: GameAddOptions): string {
  const parts: string[] = [];
  summarizeTri('caught', options.gameCaught, parts);
  summarizeTri('HOME', options.gameHome, parts);
  return parts.length ? parts.join(' · ') : 'no changes';
}

export function summarizeAddOptions(options: AddToOptions): string {
  const parts: string[] = [];
  summarizeTri('caught', options.statuses.caught, parts);
  summarizeTri('HOME', options.statuses.home, parts);
  summarizeTri('shiny', options.statuses.shiny, parts);
  summarizeTri('alpha', options.statuses.alpha, parts);
  summarizeTri('mega', options.statuses.mega, parts);
  summarizeTri('gmax', options.statuses.gmax, parts);
  summarizeTri('regional', options.statuses.regional, parts);

  let gamesOn = 0;
  let gamesOff = 0;
  for (const state of Object.values(options.games)) {
    if (state === true) gamesOn += 1;
    else if (state === false) gamesOff += 1;
  }
  if (gamesOn === 1) parts.push('1 game');
  else if (gamesOn > 1) parts.push(`${gamesOn} games`);
  if (gamesOff === 1) parts.push('−1 game');
  else if (gamesOff > 1) parts.push(`−${gamesOff} games`);

  return parts.length ? parts.join(' · ') : 'no changes';
}

const STATUS_OPTIONS: {
  key: keyof AddStatuses;
  label: string;
  icon: typeof CheckIcon;
  iconClassName?: string;
}[] = [
  { key: 'caught', label: 'Caught', icon: CheckIcon },
  { key: 'home', label: 'HOME', icon: HomeIcon, iconClassName: 'text-emerald-600' },
  { key: 'shiny', label: 'Shiny', icon: SparklesIcon, iconClassName: 'text-amber-500' },
  { key: 'alpha', label: 'Alpha', icon: EyeIcon, iconClassName: 'text-red-500' },
  { key: 'mega', label: 'Mega', icon: ZapIcon, iconClassName: 'text-violet-500' },
  { key: 'gmax', label: 'Gigantamax', icon: ExpandIcon, iconClassName: 'text-rose-500' },
  { key: 'regional', label: 'Regional', icon: GlobeIcon, iconClassName: 'text-sky-500' },
];

function triChecked(value: TriState): boolean {
  return value === true;
}

function triIndeterminate(value: TriState): boolean {
  return value === 'indeterminate';
}

export function AddToDialogButton({
  disabled,
  selectedKeys,
  onAdd,
}: {
  disabled?: boolean;
  selectedKeys: string[];
  onAdd: (options: AddToOptions) => void;
}) {
  const gameGroups = useMemo(() => getGameGroups(), []);
  const caughtByKey = useDexStore((s) => s.caughtByKey);
  const homeByKey = useDexStore((s) => s.homeByKey);
  const shinyByKey = useDexStore((s) => s.shinyByKey);
  const alphaByKey = useDexStore((s) => s.alphaByKey);
  const megaByKey = useDexStore((s) => s.megaByKey);
  const gmaxByKey = useDexStore((s) => s.gmaxByKey);
  const regionalByKey = useDexStore((s) => s.regionalByKey);
  const caughtByGame = useDexStore((s) => s.caughtByGame);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AddToOptions>(DEFAULT_OPTIONS);

  const selectedCount = selectedKeys.length;

  function buildOptionsFromSelection(keys: string[]): AddToOptions {
    // Omit games where none of the selection is marked — applying must not clear
    // unmarked games. Include checked + mixed so Apply can set or leave alone.
    const games: Partial<Record<GameId, TriState>> = {};
    for (const game of getGames()) {
      const state = aggregateFlag(keys, caughtByGame[game.id]);
      if (state !== false) games[game.id] = state;
    }
    return {
      statuses: {
        caught: aggregateFlag(keys, caughtByKey),
        home: aggregateFlag(keys, homeByKey),
        shiny: aggregateFlag(keys, shinyByKey),
        alpha: aggregateFlag(keys, alphaByKey),
        mega: aggregateFlag(keys, megaByKey),
        gmax: aggregateFlag(keys, gmaxByKey),
        regional: aggregateFlag(keys, regionalByKey),
      },
      games,
    };
  }

  const canApply = selectedCount > 0;

  function toggleStatus(key: keyof AddStatuses, next: boolean) {
    setOptions((prev) => ({
      ...prev,
      statuses: { ...prev.statuses, [key]: next },
    }));
  }

  function toggleGame(gameId: GameId, next: boolean) {
    setOptions((prev) => ({
      ...prev,
      games: { ...prev.games, [gameId]: next },
    }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setOptions(buildOptionsFromSelection(selectedKeys));
  }

  function handleAdd() {
    if (!canApply) return;
    onAdd(options);
    setOpen(false);
  }

  const countLabel = selectedCount === 1 ? '1 Pokémon' : `${selectedCount} Pokémon`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button disabled={disabled || selectedCount === 0} />}>Add</DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add to living dex</DialogTitle>
          <DialogDescription>
            Choose what to mark for {countLabel}. Mixed checkboxes keep each Pokémon’s current value. Status updates the
            national dex; games also mark those origin Pokédexes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[min(60vh,28rem)] flex-col gap-5 overflow-y-auto pr-1">
          <FieldSet>
            <FieldLegend>Status</FieldLegend>
            <FieldDescription>National living-dex flags</FieldDescription>
            <FieldGroup className="grid grid-cols-2 gap-x-3 gap-y-2">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const id = `add-status-${opt.key}`;
                const value = options.statuses[opt.key];
                return (
                  <Field key={opt.key} orientation="horizontal" className="min-w-0">
                    <Checkbox
                      id={id}
                      checked={triChecked(value)}
                      indeterminate={triIndeterminate(value)}
                      onCheckedChange={(v) => toggleStatus(opt.key, Boolean(v))}
                    />
                    <FieldLabel htmlFor={id} className="flex min-w-0 items-center gap-1.5 font-medium">
                      <Icon className={cn('shrink-0', opt.iconClassName)} />
                      <span className="truncate">{opt.label}</span>
                    </FieldLabel>
                  </Field>
                );
              })}
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend>Also mark in games</FieldLegend>
            <FieldDescription>Optional — tick any origin dexes these Pokémon should count toward</FieldDescription>
            <div className="flex flex-col gap-4">
              {gameGroups.map((group) => (
                <div key={group.name} className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{group.name}</p>
                  <FieldGroup className="gap-1.5">
                    {group.games.map((game) => {
                      const id = `add-game-${game.id}`;
                      const value = options.games[game.id] ?? false;
                      return (
                        <Field key={game.id} orientation="horizontal" className="min-w-0">
                          <Checkbox
                            id={id}
                            checked={triChecked(value)}
                            indeterminate={triIndeterminate(value)}
                            onCheckedChange={(v) => toggleGame(game.id, Boolean(v))}
                          />
                          <FieldContent className="min-w-0">
                            <FieldLabel htmlFor={id} className="flex min-w-0 items-center gap-1.5 font-normal">
                              <span className="truncate">{game.name}</span>
                              {game.kind === 'dlc' ? <Badge variant="secondary">DLC</Badge> : null}
                            </FieldLabel>
                          </FieldContent>
                        </Field>
                      );
                    })}
                  </FieldGroup>
                </div>
              ))}
            </div>
          </FieldSet>
        </div>

        <DialogFooter>
          <Button disabled={!canApply} onClick={handleAdd}>
            Add {countLabel}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const GAME_STATUS_OPTIONS: {
  key: keyof GameAddOptions;
  label: string;
  description: string;
  icon: typeof CheckIcon;
  iconClassName?: string;
}[] = [
  {
    key: 'gameCaught',
    label: 'Caught',
    description: 'This game’s Pokédex — also marks national Caught',
    icon: CheckIcon,
  },
  {
    key: 'gameHome',
    label: 'HOME',
    description: 'Banked from this game — also marks national HOME',
    icon: HomeIcon,
    iconClassName: 'text-emerald-600',
  },
];

const EMPTY_GAME_FLAGS: Record<string, boolean> = {};

export function GameAddDialogButton({
  disabled,
  selectedKeys,
  gameId,
  gameName,
  onAdd,
}: {
  disabled?: boolean;
  selectedKeys: string[];
  gameId: GameId;
  gameName: string;
  onAdd: (options: GameAddOptions) => void;
}) {
  // Stable empty fallback — `?? {}` would allocate every select and infinite-loop zustand.
  const caughtMap = useDexStore((s) => s.caughtByGame[gameId] ?? EMPTY_GAME_FLAGS);
  const homeMap = useDexStore((s) => s.homeByGame[gameId] ?? EMPTY_GAME_FLAGS);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<GameAddOptions>(DEFAULT_GAME_OPTIONS);

  const selectedCount = selectedKeys.length;
  const canApply = selectedCount > 0;

  function buildOptionsFromSelection(keys: string[]): GameAddOptions {
    return {
      gameCaught: aggregateFlag(keys, caughtMap),
      gameHome: aggregateFlag(keys, homeMap),
    };
  }

  function toggle(key: keyof GameAddOptions, next: boolean) {
    setOptions((prev) => ({ ...prev, [key]: next }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setOptions(buildOptionsFromSelection(selectedKeys));
  }

  function handleAdd() {
    if (!canApply) return;
    onAdd(options);
    setOpen(false);
  }

  const countLabel = selectedCount === 1 ? '1 Pokémon' : `${selectedCount} Pokémon`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button disabled={disabled || selectedCount === 0} />}>Add</DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add to {gameName}</DialogTitle>
          <DialogDescription>
            Choose what to mark for {countLabel}. Mixed checkboxes keep each Pokémon’s current value. Game Caught/HOME
            also update the matching national flags.
          </DialogDescription>
        </DialogHeader>

        <FieldSet>
          <FieldLegend>Marks</FieldLegend>
          <FieldGroup className="gap-2">
            {GAME_STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const id = `game-add-${opt.key}`;
              const value = options[opt.key];
              return (
                <Field key={opt.key} orientation="horizontal">
                  <Checkbox
                    id={id}
                    checked={triChecked(value)}
                    indeterminate={triIndeterminate(value)}
                    onCheckedChange={(v) => toggle(opt.key, Boolean(v))}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={id} className="flex items-center gap-1.5 font-medium">
                      <Icon className={opt.iconClassName} />
                      {opt.label}
                    </FieldLabel>
                    <FieldDescription>{opt.description}</FieldDescription>
                  </FieldContent>
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>

        <DialogFooter>
          <Button disabled={!canApply} onClick={handleAdd}>
            Add {countLabel}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
