import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canGmax, canMega } from "@/lib/form-variants";
import { getGames } from "@/lib/games";
import type { GameId } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CheckIcon,
  ChevronDownIcon,
  ExpandIcon,
  EyeIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

export type AddStatuses = {
  caught: boolean;
  shiny: boolean;
  alpha: boolean;
  mega: boolean;
  gmax: boolean;
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
  },
  gameIds: [],
};

export function parseNationalId(key: string): number {
  return Number(key.replace(/^n/, ""));
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
  if (gameIds.length) actions.setGamesCaughtMany(gameIds, keys, true);
}

export function summarizeAddOptions(options: AddToOptions): string {
  const parts: string[] = [];
  if (options.statuses.caught) parts.push("caught");
  if (options.statuses.shiny) parts.push("shiny");
  if (options.statuses.alpha) parts.push("alpha");
  if (options.statuses.mega) parts.push("mega");
  if (options.statuses.gmax) parts.push("gmax");
  if (options.gameIds.length === 1) parts.push("1 game");
  else if (options.gameIds.length > 1) parts.push(`${options.gameIds.length} games`);
  return parts.length ? parts.join(" · ") : "nothing selected";
}

export function AddToSplitButton({
  disabled,
  selectedCount,
  onAdd,
  className,
}: {
  disabled?: boolean;
  selectedCount: number;
  onAdd: (options: AddToOptions) => void;
  className?: string;
}) {
  const games = useMemo(() => getGames(), []);
  const [options, setOptions] = useState<AddToOptions>(DEFAULT_OPTIONS);

  const canApply =
    !disabled &&
    selectedCount > 0 &&
    (options.statuses.caught ||
      options.statuses.shiny ||
      options.statuses.alpha ||
      options.statuses.mega ||
      options.statuses.gmax ||
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

  return (
    <div
      data-slot="button-group"
      className={cn("inline-flex items-stretch", className)}
    >
      <Button
        size="sm"
        variant="secondary"
        disabled={!canApply}
        className="rounded-r-none"
        onClick={() => onAdd(options)}
      >
        Add
        {selectedCount > 0 ? ` (${selectedCount})` : ""}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="sm"
              variant="secondary"
              disabled={disabled || selectedCount === 0}
              className="rounded-l-none border-l border-border/60 px-2"
              aria-label="Add options"
            />
          }
        >
          <ChevronDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={options.statuses.caught}
              onCheckedChange={(v) => toggleStatus("caught", v)}
            >
              <CheckIcon className="text-muted-foreground" />
              Caught
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.statuses.shiny}
              onCheckedChange={(v) => toggleStatus("shiny", v)}
            >
              <SparklesIcon className="text-amber-500" />
              Shiny
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.statuses.alpha}
              onCheckedChange={(v) => toggleStatus("alpha", v)}
            >
              <EyeIcon className="text-red-500" />
              Alpha
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.statuses.mega}
              onCheckedChange={(v) => toggleStatus("mega", v)}
            >
              <ZapIcon className="text-violet-500" />
              Mega
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={options.statuses.gmax}
              onCheckedChange={(v) => toggleStatus("gmax", v)}
            >
              <ExpandIcon className="text-rose-500" />
              Gigantamax
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Also mark in games</DropdownMenuLabel>
            <div className="max-h-48 overflow-y-auto">
              {games.map((game) => (
                <DropdownMenuCheckboxItem
                  key={game.id}
                  checked={options.gameIds.includes(game.id)}
                  onCheckedChange={(v) => toggleGame(game.id, v)}
                >
                  <span className="truncate">{game.name}</span>
                  {game.kind === "dlc" ? (
                    <span className="ml-auto text-[10px] text-muted-foreground">DLC</span>
                  ) : null}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <div className="px-1.5 pb-1.5">
            <p className="mb-2 px-0.5 text-[11px] text-muted-foreground">
              {summarizeAddOptions(options)}
            </p>
            <Button
              size="sm"
              className="w-full"
              disabled={!canApply}
              onClick={() => onAdd(options)}
            >
              Add {selectedCount} Pokémon
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
