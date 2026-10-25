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
import { getGameGroups } from '@/lib/games';
import type { GameId } from '@/lib/types';
import { CheckIcon, ExpandIcon, EyeIcon, GlobeIcon, SparklesIcon, ZapIcon } from 'lucide-react';

export type AddStatuses = {
  caught: boolean;
  shiny: boolean;
  alpha: boolean;
  mega: boolean;
  gmax: boolean;
  regional: boolean;
};

export type AddToOptions = {
  statuses: AddStatuses;
  gameIds: GameId[];
};

const DEFAULT_OPTIONS: AddToOptions = {
  statuses: {
    caught: true,
    shiny: false,
    alpha: false,
    mega: false,
    gmax: false,
    regional: false,
  },
  gameIds: [],
};

export function parseNationalId(key: string): number {
  const match = /^n(\d+)/.exec(key);
  return match ? Number(match[1]) : Number.NaN;
}

/** Apply status + game marks for the given keys. */
export function applyAddToOptions(
  keys: string[],
  options: AddToOptions,
  actions: {
    setCaughtMany: (keys: string[], value: boolean) => void;
    setShinyMany: (keys: string[], value: boolean) => void;
    setAlphaMany: (keys: string[], value: boolean) => void;
    setMegaMany: (keys: string[], value: boolean) => void;
    setGmaxMany: (keys: string[], value: boolean) => void;
    setRegionalMany: (keys: string[], value: boolean) => void;
    setGamesCaughtMany: (gameIds: GameId[], keys: string[], value: boolean) => void;
  },
) {
  const { statuses, gameIds } = options;
  if (statuses.caught) actions.setCaughtMany(keys, true);
  if (statuses.shiny) actions.setShinyMany(keys, true);
  if (statuses.alpha) actions.setAlphaMany(keys, true);
  if (statuses.mega) {
    const megaKeys = keys.filter((key) => canMega(parseNationalId(key)));
    if (megaKeys.length) actions.setMegaMany(megaKeys, true);
  }
  if (statuses.gmax) {
    const gmaxKeys = keys.filter((key) => canGmax(parseNationalId(key)));
    if (gmaxKeys.length) actions.setGmaxMany(gmaxKeys, true);
  }
  if (statuses.regional) {
    const regionalKeys = keys.filter((key) => canRegional(parseNationalId(key)));
    if (regionalKeys.length) actions.setRegionalMany(regionalKeys, true);
  }
  if (gameIds.length) actions.setGamesCaughtMany(gameIds, keys, true);
}

export function summarizeAddOptions(options: AddToOptions): string {
  const parts: string[] = [];
  if (options.statuses.caught) parts.push('caught');
  if (options.statuses.shiny) parts.push('shiny');
  if (options.statuses.alpha) parts.push('alpha');
  if (options.statuses.mega) parts.push('mega');
  if (options.statuses.gmax) parts.push('gmax');
  if (options.statuses.regional) parts.push('regional');
  if (options.gameIds.length === 1) parts.push('1 game');
  else if (options.gameIds.length > 1) parts.push(`${options.gameIds.length} games`);
  return parts.length ? parts.join(' · ') : 'nothing selected';
}

const STATUS_OPTIONS: {
  key: keyof AddStatuses;
  label: string;
  icon: typeof CheckIcon;
  iconClassName?: string;
}[] = [
  { key: 'caught', label: 'Caught', icon: CheckIcon },
  { key: 'shiny', label: 'Shiny', icon: SparklesIcon, iconClassName: 'text-amber-500' },
  { key: 'alpha', label: 'Alpha', icon: EyeIcon, iconClassName: 'text-red-500' },
  { key: 'mega', label: 'Mega', icon: ZapIcon, iconClassName: 'text-violet-500' },
  { key: 'gmax', label: 'Gigantamax', icon: ExpandIcon, iconClassName: 'text-rose-500' },
  { key: 'regional', label: 'Regional', icon: GlobeIcon, iconClassName: 'text-sky-500' },
];

export function AddToDialogButton({
  disabled,
  selectedCount,
  onAdd,
}: {
  disabled?: boolean;
  selectedCount: number;
  onAdd: (options: AddToOptions) => void;
}) {
  const gameGroups = useMemo(() => getGameGroups(), []);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<AddToOptions>(DEFAULT_OPTIONS);

  const canApply =
    selectedCount > 0 &&
    (options.statuses.caught ||
      options.statuses.shiny ||
      options.statuses.alpha ||
      options.statuses.mega ||
      options.statuses.gmax ||
      options.statuses.regional ||
      options.gameIds.length > 0);

  function toggleStatus(key: keyof AddStatuses, next: boolean) {
    setOptions((prev) => ({
      ...prev,
      statuses: { ...prev.statuses, [key]: next },
    }));
  }

  function toggleGame(gameId: GameId, next: boolean) {
    setOptions((prev) => {
      const set = new Set(prev.gameIds);
      if (next) set.add(gameId);
      else set.delete(gameId);
      return { ...prev, gameIds: Array.from(set) };
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setOptions(DEFAULT_OPTIONS);
  }

  function handleAdd() {
    if (!canApply) return;
    onAdd(options);
    setOpen(false);
  }

  const countLabel = selectedCount === 1 ? '1 Pokémon' : `${selectedCount} Pokémon`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" disabled={disabled || selectedCount === 0} />}>Add</DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Add to living dex</DialogTitle>
          <DialogDescription>
            Choose what to mark for {countLabel}. Status updates the national dex; games also mark those origin
            Pokédexes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[min(60vh,28rem)] flex-col gap-5 overflow-y-auto pr-1">
          <FieldSet>
            <FieldLegend>Status</FieldLegend>
            <FieldDescription>National living-dex flags</FieldDescription>
            <FieldGroup className="gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const id = `add-status-${opt.key}`;
                return (
                  <Field key={opt.key} orientation="horizontal">
                    <Checkbox
                      id={id}
                      checked={options.statuses[opt.key]}
                      onCheckedChange={(v) => toggleStatus(opt.key, Boolean(v))}
                    />
                    <FieldLabel htmlFor={id} className="flex items-center gap-1.5 font-medium">
                      <Icon className={opt.iconClassName} />
                      {opt.label}
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
                      return (
                        <Field key={game.id} orientation="horizontal" className="min-w-0">
                          <Checkbox
                            id={id}
                            checked={options.gameIds.includes(game.id)}
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!canApply} onClick={handleAdd}>
            Add {countLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
