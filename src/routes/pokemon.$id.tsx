import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { EvolutionChart } from "@/components/evolution-chart";
import { GameLogo } from "@/components/game-logo";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { getEvolutionChain, getPokemonSummary } from "@/server/pokemon";
import { useDexStore } from "@/lib/store";
import { canGmax, canMega } from "@/lib/form-variants";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  SparklesIcon,
  EyeIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getGameGroupsForSpecies } from "@/lib/games";
import nationalDex from "@/data/national-dex.json";

const nationalOrder = (() => {
  const slots: { id: number; name: string }[] = [];
  for (const box of nationalDex.boxes as Array<{ slots: Array<{ id: number; name: string }> }>) {
    for (const slot of box.slots) slots.push({ id: slot.id, name: slot.name });
  }
  return slots;
})();

const nationalIndexById = new Map(nationalOrder.map((slot, index) => [slot.id, index]));

function nationalNeighbors(id: number) {
  const index = nationalIndexById.get(id);
  if (index == null) return { prev: null, next: null };
  return {
    prev: index > 0 ? nationalOrder[index - 1]! : null,
    next: index < nationalOrder.length - 1 ? nationalOrder[index + 1]! : null,
  };
}

export const Route = createFileRoute("/pokemon/$id")({
  loader: async ({ params }) => {
    const [summary, chain] = await Promise.all([
      getPokemonSummary({ data: { id: params.id } }),
      getEvolutionChain({ data: { id: params.id } }),
    ]);
    return { summary, chain };
  },
  pendingComponent: PokemonPending,
  errorComponent: PokemonError,
  component: PokemonPage,
});

function PokemonPending() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

function PokemonError() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-3 py-12 text-center">
      <p className="font-semibold">Pokémon not found</p>
      <Button variant="outline" render={<Link to="/dex" />} nativeButton={false}>
        Back to dex
      </Button>
    </div>
  );
}

function PokemonPage() {
  const { summary, chain } = Route.useLoaderData();
  const key = `n${summary.id}`;
  const caught = useDexStore((s) => Boolean(s.caughtByKey[key]));
  const shiny = useDexStore((s) => Boolean(s.shinyByKey[key]));
  const alpha = useDexStore((s) => Boolean(s.alphaByKey[key]));
  const mega = useDexStore((s) => Boolean(s.megaByKey[key]));
  const gmax = useDexStore((s) => Boolean(s.gmaxByKey[key]));
  const caughtByGame = useDexStore((s) => s.caughtByGame);
  const setCaught = useDexStore((s) => s.setCaught);
  const setShiny = useDexStore((s) => s.setShiny);
  const setAlpha = useDexStore((s) => s.setAlpha);
  const setMega = useDexStore((s) => s.setMega);
  const setGmax = useDexStore((s) => s.setGmax);
  const setGameCaught = useDexStore((s) => s.setGameCaught);
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);

  const gameGroups = getGameGroupsForSpecies(summary.id);
  const hasMega = canMega(summary.id);
  const hasGmax = canGmax(summary.id);
  const { prev, next } = nationalNeighbors(summary.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link to="/dex" />}
          nativeButton={false}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Dex
        </Button>
        <PokemonAdjacentNav prev={prev} next={next} />
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <Card
          className={cn(
            "items-center border-2 md:w-56 md:shrink-0",
            shiny
              ? "border-amber-400 shadow-[0_0_16px_rgba(232,121,249,0.35)]"
              : alpha
                ? "border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                : mega
                  ? "border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                  : gmax
                    ? "border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                    : undefined,
          )}
        >
          <CardContent className="flex flex-col items-center gap-3 pt-6">
            <PokemonSprite
              id={summary.id}
              style={spriteStyle}
              shiny={shiny}
              variant={mega ? "mega" : gmax ? "gmax" : "default"}
              slug={summary.slug}
              width={160}
              height={160}
              loading="eager"
              className={cn("size-36 sm:size-40", (alpha || gmax) && "scale-110")}
            />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                #{String(summary.id).padStart(4, "0")}
              </p>
              <h1 className="text-xl font-bold">{summary.name}</h1>
              {summary.genus ? (
                <p className="text-sm text-muted-foreground">{summary.genus}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              <Badge variant={caught ? "default" : "outline"}>
                {caught ? "Caught" : "Missing"}
              </Badge>
              {shiny ? (
                <Badge variant="secondary">
                  <SparklesIcon data-icon="inline-start" />
                  Shiny
                </Badge>
              ) : null}
              {alpha ? (
                <Badge variant="secondary">
                  <EyeIcon data-icon="inline-start" />
                  Alpha
                </Badge>
              ) : null}
              {mega ? (
                <Badge variant="secondary">
                  <ZapIcon data-icon="inline-start" />
                  Mega
                </Badge>
              ) : null}
              {gmax ? (
                <Badge variant="secondary">
                  <ExpandIcon data-icon="inline-start" />
                  Gigantamax
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {summary.flavor ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{summary.flavor}</p>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>National</CardTitle>
              <CardDescription>Living dex status and form flags for this species.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Caught</FieldTitle>
                  </FieldContent>
                  <Switch checked={caught} onCheckedChange={(v) => setCaught(key, v)} />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel className="flex items-center gap-1.5">
                      <SparklesIcon className="size-4 text-amber-500" />
                      Shiny
                    </FieldLabel>
                  </FieldContent>
                  <Switch checked={shiny} onCheckedChange={(v) => setShiny(key, v)} />
                </Field>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel className="flex items-center gap-1.5">
                      <EyeIcon className="size-4 text-red-500" />
                      Alpha
                    </FieldLabel>
                  </FieldContent>
                  <Switch checked={alpha} onCheckedChange={(v) => setAlpha(key, v)} />
                </Field>
                {hasMega ? (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel className="flex items-center gap-1.5">
                        <ZapIcon className="size-4 text-violet-500" />
                        Mega
                      </FieldLabel>
                    </FieldContent>
                    <Switch checked={mega} onCheckedChange={(v) => setMega(key, v)} />
                  </Field>
                ) : null}
                {hasGmax ? (
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel className="flex items-center gap-1.5">
                        <ExpandIcon className="size-4 text-rose-500" />
                        Gigantamax
                      </FieldLabel>
                    </FieldContent>
                    <Switch checked={gmax} onCheckedChange={(v) => setGmax(key, v)} />
                  </Field>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {gameGroups.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Games & DLC</CardTitle>
                <CardDescription>
                  Origin dexes this species appears in — main games and expansions separately.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldSet>
                  <FieldLegend className="sr-only">Game caught</FieldLegend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {gameGroups.map((group) => (
                      <div key={group.name} className="flex min-w-0 flex-col gap-2">
                        <GameLogo
                          logo={group.logo}
                          title={group.name}
                          variant="wordmark"
                          className="h-7 max-w-full"
                        />
                        <FieldGroup className="gap-2">
                          {group.games.map((game) => {
                            const inGame = Boolean(caughtByGame[game.id]?.[key]);
                            return (
                              <Field key={game.id} orientation="horizontal" className="min-w-0">
                                <FieldContent className="min-w-0">
                                  <FieldTitle className="flex min-w-0 items-center gap-1.5 text-sm">
                                    <span className="truncate">{game.name}</span>
                                    {game.kind === "dlc" ? (
                                      <Badge variant="secondary" className="shrink-0 text-[9px]">
                                        DLC
                                      </Badge>
                                    ) : null}
                                  </FieldTitle>
                                </FieldContent>
                                <Switch
                                  checked={inGame}
                                  onCheckedChange={(v) => setGameCaught(game.id, key, v)}
                                />
                              </Field>
                            );
                          })}
                        </FieldGroup>
                      </div>
                    ))}
                  </div>
                </FieldSet>
              </CardContent>
            </Card>
          ) : null}

          <EvolutionChart chain={chain} spriteStyle={spriteStyle} />
        </div>
      </div>

      <PokemonAdjacentNav
        prev={prev}
        next={next}
        className="w-full justify-between border-t border-border pt-4"
      />
    </div>
  );
}

function PokemonAdjacentNav({
  prev,
  next,
  className,
}: {
  prev: { id: number; name: string } | null;
  next: { id: number; name: string } | null;
  className?: string;
}) {
  return (
    <nav
      className={cn("flex min-w-0 items-center justify-end gap-2", className)}
      aria-label="Adjacent Pokémon"
    >
      {prev ? (
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 max-w-[48%] justify-start"
          render={<Link to="/pokemon/$id" params={{ id: String(prev.id) }} />}
          nativeButton={false}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          <span className="truncate">
            <span className="text-muted-foreground tabular-nums">
              #{String(prev.id).padStart(4, "0")}
            </span>{" "}
            {prev.name}
          </span>
        </Button>
      ) : (
        <span className="min-w-0 max-w-[48%]" aria-hidden />
      )}
      {next ? (
        <Button
          variant="outline"
          size="sm"
          className="min-w-0 max-w-[48%] justify-end"
          render={<Link to="/pokemon/$id" params={{ id: String(next.id) }} />}
          nativeButton={false}
        >
          <span className="truncate">
            <span className="text-muted-foreground tabular-nums">
              #{String(next.id).padStart(4, "0")}
            </span>{" "}
            {next.name}
          </span>
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      ) : (
        <span className="min-w-0 max-w-[48%]" aria-hidden />
      )}
    </nav>
  );
}
