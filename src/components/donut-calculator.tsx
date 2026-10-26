import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { berrySpriteUrl, capitalizeBerryId, hyperBerryHowto } from '@/lib/berries';
import {
  availableIncludingSubstitutes,
  checkDonutRecipe,
  DONUT_STAR_FLAVOR,
  donutShortLabel,
  donutSpriteUrl,
  getAllHyperBerryIds,
  getSpecialDonutRecipes,
  inventoryAfterSpend,
  suggestDonutForStars,
  suggestTipMix,
  type DonutStar,
  type MixGoal,
} from '@/lib/donut-calculator';
import { useHyperBerryStore } from '@/lib/hyper-berry-store';
import { CheckIcon, ChevronDownIcon, InfoIcon, MinusIcon, PlusIcon, XIcon } from 'lucide-react';

const STAR_OPTIONS: DonutStar[] = [1, 2, 3, 4, 5];

const MIX_GOALS: { id: MixGoal; label: string }[] = [
  { id: 'stars', label: '★ Rank' },
  { id: 'shiny', label: 'Shiny' },
  { id: 'farm', label: 'Farm' },
  { id: 'cheap', label: 'Cheap farm' },
  { id: 'early', label: 'Early' },
  { id: 'mid', label: 'Mid' },
  { id: 'late', label: 'Late' },
];

function BerryCountStepper({ id, value, onChange }: { id: string; value: number; onChange: (next: number) => void }) {
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
  const setCounts = useHyperBerryStore((s) => s.setCounts);
  const clearAll = useHyperBerryStore((s) => s.clearAll);
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [mixGoal, setMixGoal] = useState<MixGoal>('stars');
  const [targetStars, setTargetStars] = useState<DonutStar>(3);

  const recipe = recipes[recipeIndex] ?? recipes[0];
  const result = useMemo(() => (recipe ? checkDonutRecipe(counts, recipe) : null), [counts, recipe]);
  const starSuggestion = useMemo(() => suggestDonutForStars(counts, targetStars), [counts, targetStars]);
  const tipSuggestion = useMemo(() => (mixGoal === 'stars' ? null : suggestTipMix(counts, mixGoal)), [counts, mixGoal]);

  function makeSuggestedMix(ingredients: { id: string; count: number }[], substitutes: boolean) {
    const next = inventoryAfterSpend(counts, ingredients, { substitutes });
    if (next) setCounts(next);
  }

  if (recipes.length === 0 || !recipe || !result) return null;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Portal donut calculator</CardTitle>
        <CardDescription>
          Track all {berryIds.length} Mega Dimension Hyper Berries (saved in this browser), pick a legendary portal
          recipe, and see if you can cook it (optional berries ignored; Coba ↔ Rindo substitutes count).
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
            {berryIds.map((id) => {
              const howto = hyperBerryHowto(id);
              const name = capitalizeBerryId(id);
              return (
                <li key={id} className="flex items-center gap-2">
                  <img
                    src={berrySpriteUrl(id, { hyper: true })}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <Label
                      htmlFor={`hyper-${id}`}
                      className="min-w-0 truncate text-sm font-normal normal-case tracking-normal"
                    >
                      {name}
                    </Label>
                    {howto ? (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="shrink-0"
                              aria-label={`${name} farming tip`}
                            />
                          }
                        >
                          <InfoIcon />
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start">
                          <PopoverHeader>
                            <PopoverTitle>{name}</PopoverTitle>
                            <PopoverDescription>{howto}</PopoverDescription>
                          </PopoverHeader>
                        </PopoverContent>
                      </Popover>
                    ) : null}
                  </div>
                  <BerryCountStepper id={id} value={counts[id] ?? 0} onChange={(next) => setCount(id, next)} />
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Suggest mix</Label>
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[mixGoal]}
            onValueChange={(next) => {
              const id = next[0] as MixGoal | undefined;
              if (id) setMixGoal(id);
            }}
            className="flex w-full flex-wrap"
          >
            {MIX_GOALS.map((goal) => (
              <ToggleGroupItem key={goal.id} value={goal.id} aria-label={goal.label}>
                {goal.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {mixGoal === 'stars' ? (
            <>
              <ToggleGroup
                variant="outline"
                size="sm"
                value={[String(targetStars)]}
                onValueChange={(next) => {
                  const v = Number(next[0]);
                  if (v >= 1 && v <= 5) setTargetStars(v as DonutStar);
                }}
                className="grid w-full grid-cols-5"
              >
                {STAR_OPTIONS.map((star) => (
                  <ToggleGroupItem key={star} value={String(star)} aria-label={`${star} star`}>
                    {star}★
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">
                Needs ≥{DONUT_STAR_FLAVOR[targetStars]} flavor · prefers berries you have most of (max 8 slots)
              </p>
              {starSuggestion.ingredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add berries to your stash first.</p>
              ) : (
                <>
                  <Badge variant={starSuggestion.canMake ? 'default' : 'destructive'} className="w-fit">
                    {starSuggestion.canMake ? (
                      <CheckIcon data-icon="inline-start" />
                    ) : (
                      <XIcon data-icon="inline-start" />
                    )}
                    {starSuggestion.flavor}/{starSuggestion.targetFlavor} flavor
                    {starSuggestion.canMake ? '' : ' — short'}
                  </Badge>
                  <div className="flex flex-wrap items-center gap-2">
                    <ul className="flex flex-wrap items-center gap-2">
                      {starSuggestion.ingredients.map((berry) => (
                        <Badge key={berry.id} variant="outline">
                          <img src={berrySpriteUrl(berry.id, { hyper: true })} alt="" loading="lazy" />×{berry.count}{' '}
                          {capitalizeBerryId(berry.id)}
                        </Badge>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!starSuggestion.canMake}
                      onClick={() => makeSuggestedMix(starSuggestion.ingredients, false)}
                    >
                      Make
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : tipSuggestion ? (
            <>
              <p className="text-xs text-muted-foreground">
                Best tip recipe for your stash
                {tipSuggestion.note ? ` · ${tipSuggestion.note}` : ''}
              </p>
              <Badge variant={tipSuggestion.canMake ? 'default' : 'destructive'} className="w-fit">
                {tipSuggestion.canMake ? <CheckIcon data-icon="inline-start" /> : <XIcon data-icon="inline-start" />}
                {tipSuggestion.canMake ? 'Can make' : 'Missing berries'}
              </Badge>
              <div className="flex flex-wrap items-center gap-2">
                <ul className="flex flex-wrap items-center gap-2">
                  {tipSuggestion.ingredients.map((berry) => (
                    <Badge key={berry.id} variant="outline">
                      <img
                        src={berrySpriteUrl(berry.id, { hyper: berry.hyper !== false })}
                        alt=""
                        loading="lazy"
                        style={berry.hyper === false ? { imageRendering: 'pixelated' } : undefined}
                      />
                      ×{berry.count} {capitalizeBerryId(berry.id)}
                    </Badge>
                  ))}
                </ul>
                <Button
                  type="button"
                  size="sm"
                  disabled={!tipSuggestion.canMake}
                  onClick={() => makeSuggestedMix(tipSuggestion.ingredients, true)}
                >
                  Make
                </Button>
              </div>
              {!tipSuggestion.canMake && tipSuggestion.missing.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {tipSuggestion.missing.map((berry) => (
                    <li key={berry.id} className="text-xs text-muted-foreground">
                      Need {berry.count} more {capitalizeBerryId(berry.id)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No tip recipes for this goal.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Portal recipe</Label>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="outline" className="w-full justify-between" />}>
              <span className="flex min-w-0 items-center gap-2">
                {recipe.donut ? (
                  <img src={donutSpriteUrl(recipe.donut)} alt="" width={28} height={28} className="size-7 shrink-0" />
                ) : null}
                <span className="truncate">{donutShortLabel(recipe)}</span>
              </span>
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-(--anchor-width)">
              <DropdownMenuRadioGroup value={String(recipeIndex)} onValueChange={(v) => setRecipeIndex(Number(v))}>
                {recipes.map((r, i) => (
                  <DropdownMenuRadioItem key={r.label ?? i} value={String(i)}>
                    <span className="flex min-w-0 items-center gap-2">
                      {r.donut ? (
                        <img src={donutSpriteUrl(r.donut)} alt="" width={24} height={24} className="size-6 shrink-0" />
                      ) : null}
                      <span className="truncate">{donutShortLabel(r)}</span>
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {recipe.label ? <p className="text-xs text-muted-foreground">{recipe.label}</p> : null}
          {recipe.note ? <p className="text-xs text-muted-foreground">{recipe.note}</p> : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
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
            <Button
              type="button"
              size="sm"
              disabled={!result.canMake}
              onClick={() => makeSuggestedMix(result.required, true)}
            >
              Make
            </Button>
          </div>

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
                  <span className="min-w-0 flex-1 truncate">{capitalizeBerryId(berry.id)}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {have}/{berry.count}
                  </span>
                  {ok ? <Badge variant="secondary">OK</Badge> : <Badge variant="destructive">need {short}</Badge>}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
