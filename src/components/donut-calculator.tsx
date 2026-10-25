import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { berrySpriteUrl, capitalizeBerryId } from "@/lib/berries";
import {
  availableIncludingSubstitutes,
  checkDonutRecipe,
  donutShortLabel,
  donutSpriteUrl,
  getAllHyperBerryIds,
  getSpecialDonutRecipes,
} from "@/lib/donut-calculator";
import { useHyperBerryStore } from "@/lib/hyper-berry-store";
import { CheckIcon, ChevronDownIcon, MinusIcon, PlusIcon, XIcon } from "lucide-react";

function BerryCountStepper({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (next: number) => void;
}) {
  const label = capitalizeBerryId(id);
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        aria-label={`Decrease ${label}`}
      >
        <MinusIcon />
      </Button>
      <Input
        id={`hyper-${id}`}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 w-12 text-center tabular-nums"
        aria-label={`${label} count`}
      />
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        onClick={() => onChange(value + 1)}
        aria-label={`Increase ${label}`}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

export function DonutCalculator() {
  const recipes = useMemo(() => getSpecialDonutRecipes(), []);
  const berryIds = useMemo(() => getAllHyperBerryIds(), []);
  const counts = useHyperBerryStore((s) => s.counts);
  const setCount = useHyperBerryStore((s) => s.setCount);
  const clearAll = useHyperBerryStore((s) => s.clearAll);
  const [recipeIndex, setRecipeIndex] = useState(0);

  const recipe = recipes[recipeIndex] ?? recipes[0];
  const result = useMemo(
    () => (recipe ? checkDonutRecipe(counts, recipe) : null),
    [counts, recipe],
  );

  if (recipes.length === 0 || !recipe || !result) return null;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Portal donut calculator</CardTitle>
        <CardDescription>
          Track all {berryIds.length} Mega Dimension Hyper Berries (saved in this browser),
          pick a legendary portal recipe, and see if you can cook it (optional berries
          ignored; Coba ↔ Rindo substitutes count).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Hyper berry stash</Label>
            <Button type="button" variant="ghost" size="xs" onClick={clearAll}>
              Clear
            </Button>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {berryIds.map((id) => (
              <li key={id} className="flex items-center gap-2">
                <img
                  src={berrySpriteUrl(id, { hyper: true })}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0"
                  loading="lazy"
                />
                <Label
                  htmlFor={`hyper-${id}`}
                  className="min-w-0 flex-1 text-sm font-normal normal-case tracking-normal"
                >
                  {capitalizeBerryId(id)}
                </Label>
                <BerryCountStepper
                  id={id}
                  value={counts[id] ?? 0}
                  onChange={(next) => setCount(id, next)}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Portal recipe</Label>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" className="w-full justify-between" />
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                {recipe.donut ? (
                  <img
                    src={donutSpriteUrl(recipe.donut)}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0"
                  />
                ) : null}
                <span className="truncate">{donutShortLabel(recipe)}</span>
              </span>
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width)">
              <DropdownMenuRadioGroup
                value={String(recipeIndex)}
                onValueChange={(v) => setRecipeIndex(Number(v))}
              >
                {recipes.map((r, i) => (
                  <DropdownMenuRadioItem key={r.label ?? i} value={String(i)}>
                    <span className="flex min-w-0 items-center gap-2">
                      {r.donut ? (
                        <img
                          src={donutSpriteUrl(r.donut)}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6 shrink-0"
                        />
                      ) : null}
                      <span className="truncate">{donutShortLabel(r)}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {recipe.label ? (
            <p className="text-xs text-muted-foreground">{recipe.label}</p>
          ) : null}
          {recipe.note ? (
            <p className="text-xs text-muted-foreground">{recipe.note}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          {result.canMake ? (
            <Badge variant="default" className="w-fit">
              <CheckIcon data-icon="inline-start" />
              Can make
            </Badge>
          ) : (
            <Badge variant="destructive" className="w-fit">
              <XIcon data-icon="inline-start" />
              Missing berries
            </Badge>
          )}

          <ul className="flex flex-col gap-1.5">
            {result.required.map((berry) => {
              const have = availableIncludingSubstitutes(counts, berry.id);
              const short = result.missing.find((m) => m.id === berry.id)?.count ?? 0;
              const ok = short === 0;
              return (
                <li key={berry.id} className="flex items-center gap-2 text-sm">
                  <img
                    src={berrySpriteUrl(berry.id, { hyper: true })}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6 shrink-0"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {capitalizeBerryId(berry.id)}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {have}/{berry.count}
                  </span>
                  {ok ? (
                    <Badge variant="secondary">OK</Badge>
                  ) : (
                    <Badge variant="destructive">need {short}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
