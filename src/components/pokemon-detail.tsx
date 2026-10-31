import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item';
import { EvolutionChart } from '@/components/evolution-chart';
import { MovePoolDialog } from '@/components/move-pool-dialog';
import { PokemonSprite } from '@/components/pokemon-sprite';
import { TypeBadge } from '@/components/type-badge';
import { useDexStore } from '@/lib/store';
import { canGmax, canMega, canRegional } from '@/lib/form-variants';
import type { EvoNode } from '@/lib/evolution';
import { parsePokemonType } from '@/lib/move-types';
import { getGameGroupsForSpecies } from '@/lib/games';
import type { GameId } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ExpandIcon, ExternalLinkIcon, EyeIcon, GlobeIcon, HomeIcon, SparklesIcon, ZapIcon } from 'lucide-react';

export type PokemonSummary = {
  id: number;
  slug: string;
  name: string;
  genus: string;
  flavor: string;
  types: string[];
  sprite: string;
};

type PokemonNavSearch = { from?: 'games'; game?: GameId };

export function PokemonDetail({
  summary,
  chain,
  navSearch,
  onSelectSpecies,
  permalink = false,
}: {
  summary: PokemonSummary;
  chain: EvoNode;
  navSearch?: PokemonNavSearch;
  /** When set, evolution stages switch in-place instead of navigating. */
  onSelectSpecies?: (id: number) => void;
  /** Show a link to the standalone `/pokemon/$id` page. */
  permalink?: boolean;
}) {
  const key = `n${summary.id}`;
  const caught = useDexStore((s) => Boolean(s.caughtByKey[key]));
  const home = useDexStore((s) => Boolean(s.homeByKey[key]));
  const shiny = useDexStore((s) => Boolean(s.shinyByKey[key]));
  const alpha = useDexStore((s) => Boolean(s.alphaByKey[key]));
  const mega = useDexStore((s) => Boolean(s.megaByKey[key]));
  const gmax = useDexStore((s) => Boolean(s.gmaxByKey[key]));
  const regional = useDexStore((s) => Boolean(s.regionalByKey[key]));
  const caughtByGame = useDexStore((s) => s.caughtByGame);
  const homeByGame = useDexStore((s) => s.homeByGame);
  const setCaught = useDexStore((s) => s.setCaught);
  const setHome = useDexStore((s) => s.setHome);
  const setShiny = useDexStore((s) => s.setShiny);
  const setAlpha = useDexStore((s) => s.setAlpha);
  const setMega = useDexStore((s) => s.setMega);
  const setGmax = useDexStore((s) => s.setGmax);
  const setRegional = useDexStore((s) => s.setRegional);
  const setGameCaught = useDexStore((s) => s.setGameCaught);
  const setGameHome = useDexStore((s) => s.setGameHome);
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);

  const gameGroups = getGameGroupsForSpecies(summary.id);
  const hasMega = canMega(summary.id);
  const hasGmax = canGmax(summary.id);
  const hasRegional = canRegional(summary.id);

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <Card className="items-center md:w-56 md:shrink-0">
        <CardContent className="flex flex-col items-center gap-3">
          <PokemonSprite
            id={summary.id}
            style={spriteStyle}
            shiny={shiny}
            variant={mega ? 'mega' : gmax ? 'gmax' : regional ? 'regional' : 'default'}
            slug={summary.slug}
            width={160}
            height={160}
            loading="eager"
            className={cn('size-36 sm:size-40', (alpha || gmax) && 'scale-110')}
          />
          <div className="text-center">
            <p className="text-xs text-muted-foreground">#{String(summary.id).padStart(4, '0')}</p>
            <h2 className="text-xl font-bold">{summary.name}</h2>
            {summary.genus ? <p className="text-sm text-muted-foreground">{summary.genus}</p> : null}
          </div>
          {summary.types?.length ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {summary.types.map((typeName: string) => {
                const type = parsePokemonType(typeName);
                const label = typeName.charAt(0).toUpperCase() + typeName.slice(1);
                return <TypeBadge key={typeName} label={label} type={type} />;
              })}
            </div>
          ) : null}
          <MovePoolDialog pokemonId={summary.id} pokemonName={summary.name} />
          {permalink ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              render={<Link to="/pokemon/$id" params={{ id: String(summary.id) }} search={navSearch} />}
              nativeButton={false}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              Open page
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {summary.flavor ? <p className="text-sm leading-relaxed text-muted-foreground">{summary.flavor}</p> : null}

        <Card>
          <CardHeader>
            <CardTitle>National</CardTitle>
            <CardDescription>Living dex status and form flags for this species.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="flex-row flex-wrap gap-2">
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle>Caught</ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Switch checked={caught} onCheckedChange={(v) => setCaught(key, v)} aria-label="Caught" />
                </ItemActions>
              </Item>
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-1.5">
                    <HomeIcon className="text-emerald-600" />
                    HOME
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Switch checked={home} onCheckedChange={(v) => setHome(key, v)} aria-label="HOME" />
                </ItemActions>
              </Item>
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-1.5">
                    <SparklesIcon className="text-amber-500" />
                    Shiny
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Switch checked={shiny} onCheckedChange={(v) => setShiny(key, v)} aria-label="Shiny" />
                </ItemActions>
              </Item>
              <Item variant="outline" size="sm">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-1.5">
                    <EyeIcon className="text-red-500" />
                    Alpha
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  <Switch checked={alpha} onCheckedChange={(v) => setAlpha(key, v)} aria-label="Alpha" />
                </ItemActions>
              </Item>
              {hasMega ? (
                <Item variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle className="flex items-center gap-1.5">
                      <ZapIcon className="text-violet-500" />
                      Mega
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Switch checked={mega} onCheckedChange={(v) => setMega(key, v)} aria-label="Mega" />
                  </ItemActions>
                </Item>
              ) : null}
              {hasGmax ? (
                <Item variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle className="flex items-center gap-1.5">
                      <ExpandIcon className="text-rose-500" />
                      Gigantamax
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Switch checked={gmax} onCheckedChange={(v) => setGmax(key, v)} aria-label="Gigantamax" />
                  </ItemActions>
                </Item>
              ) : null}
              {hasRegional ? (
                <Item variant="outline" size="sm">
                  <ItemContent>
                    <ItemTitle className="flex items-center gap-1.5">
                      <GlobeIcon className="text-sky-500" />
                      Regional
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Switch checked={regional} onCheckedChange={(v) => setRegional(key, v)} aria-label="Regional" />
                  </ItemActions>
                </Item>
              ) : null}
            </ItemGroup>
          </CardContent>
        </Card>

        {gameGroups.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Games & DLC</CardTitle>
              <CardDescription>
                Origin Caught/HOME also mark the matching national flags. Clearing a game mark leaves national as-is.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {gameGroups.flatMap((group) =>
                group.games.map((game) => {
                  const inGame = Boolean(caughtByGame[game.id]?.[key]);
                  const inHome = Boolean(homeByGame[game.id]?.[key]);
                  return (
                    <Item key={game.id} variant="outline" size="sm" className="flex-wrap">
                      <ItemContent>
                        <ItemTitle>
                          {game.name}
                          {game.kind === 'dlc' ? <Badge variant="secondary">DLC</Badge> : null}
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions className="flex flex-wrap gap-3">
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Caught</span>
                          <Switch
                            checked={inGame}
                            onCheckedChange={(v) => setGameCaught(game.id, key, v)}
                            aria-label={`Caught in ${game.name}`}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <HomeIcon className="size-3.5 text-emerald-600" aria-hidden />
                            HOME
                          </span>
                          <Switch
                            checked={inHome}
                            onCheckedChange={(v) => setGameHome(game.id, key, v)}
                            aria-label={`HOME from ${game.name}`}
                          />
                        </label>
                      </ItemActions>
                    </Item>
                  );
                }),
              )}
            </CardContent>
          </Card>
        ) : null}

        <EvolutionChart chain={chain} spriteStyle={spriteStyle} search={navSearch} onSelectSpecies={onSelectSpecies} />
      </div>
    </div>
  );
}
