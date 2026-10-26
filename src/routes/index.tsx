import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { GameLogo } from '@/components/game-logo';
import { PokeballIcon, PokeballLogo } from '@/components/pokeball-logo';
import { useDexStore } from '@/lib/store';
import { countFlag, countGameProgress, countProgress } from '@/lib/dex-stats';
import { categorizeGifts } from '@/lib/gifts';
import { getGames } from '@/lib/games';
import { loadGiftFeed } from '@/server/gifts';
import nationalDex from '@/data/national-dex.json';
import {
  ArrowRightIcon,
  CheckIcon,
  ExpandIcon,
  EyeIcon,
  GiftIcon,
  GlobeIcon,
  SparklesIcon,
  ZapIcon,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  loader: () => loadGiftFeed(),
  component: HomePage,
});

function HomePage() {
  const feed = Route.useLoaderData();
  const caughtByKey = useDexStore((s) => s.caughtByKey);
  const homeByKey = useDexStore((s) => s.homeByKey);
  const shinyByKey = useDexStore((s) => s.shinyByKey);
  const alphaByKey = useDexStore((s) => s.alphaByKey);
  const megaByKey = useDexStore((s) => s.megaByKey);
  const gmaxByKey = useDexStore((s) => s.gmaxByKey);
  const regionalByKey = useDexStore((s) => s.regionalByKey);
  const caughtByGame = useDexStore((s) => s.caughtByGame);
  const claimedGiftIds = useDexStore((s) => s.claimedGiftIds);

  const { total, caught: home, percent } = countProgress(nationalDex.boxes, homeByKey);
  const caughtCount = countFlag(caughtByKey);
  const shinyCount = countFlag(shinyByKey);
  const alphaCount = countFlag(alphaByKey);
  const megaCount = countFlag(megaByKey);
  const gmaxCount = countFlag(gmaxByKey);
  const regionalCount = countFlag(regionalByKey);

  const gameStats = useMemo(() => {
    return getGames().map((game) => {
      const progress = countGameProgress(game.boxes, caughtByGame[game.id]);
      return {
        game,
        ...progress,
        complete: progress.total > 0 && progress.caught === progress.total,
      };
    });
  }, [caughtByGame]);

  const gamesComplete = gameStats.filter((g) => g.complete).length;
  const { active, endingSoon } = categorizeGifts(feed.gifts);
  const liveGifts = [...endingSoon, ...active];
  const activeGiftCount = liveGifts.length;
  const unclaimedGiftCount = liveGifts.filter((g) => !claimedGiftIds.includes(g.id)).length;
  const giftBadge = unclaimedGiftCount > 0 ? unclaimedGiftCount : activeGiftCount;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-3">
        <PokeballLogo size="lg" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your living dex</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Track HOME-style boxes offline. Progress stays on this device.
          </p>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>National progress</CardTitle>
          <CardDescription>
            {home} / {total} in HOME · {nationalDex.boxes.length} boxes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Progress value={percent} className="h-2" />
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{percent}% complete</Badge>
            <Badge variant="outline">{total - home} missing</Badge>
            {caughtCount > 0 ? (
              <Badge variant="outline">
                <PokeballIcon data-icon="inline-start" className="size-3.5" />
                {caughtCount} caught
              </Badge>
            ) : null}
            {shinyCount > 0 ? (
              <Badge variant="outline">
                <SparklesIcon data-icon="inline-start" className="text-amber-500" />
                {shinyCount} shiny
              </Badge>
            ) : null}
            {alphaCount > 0 ? (
              <Badge variant="outline">
                <EyeIcon data-icon="inline-start" className="text-red-500" />
                {alphaCount} alpha
              </Badge>
            ) : null}
            {megaCount > 0 ? (
              <Badge variant="outline">
                <ZapIcon data-icon="inline-start" className="text-violet-500" />
                {megaCount} mega
              </Badge>
            ) : null}
            {gmaxCount > 0 ? (
              <Badge variant="outline">
                <ExpandIcon data-icon="inline-start" className="text-rose-500" />
                {gmaxCount} gmax
              </Badge>
            ) : null}
            {regionalCount > 0 ? (
              <Badge variant="outline">
                <GlobeIcon data-icon="inline-start" className="text-sky-500" />
                {regionalCount} regional
              </Badge>
            ) : null}
          </div>
          <Button render={<Link to="/dex" />} nativeButton={false}>
            Open dex
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Game dexes</CardTitle>
          <CardDescription>
            {gameStats.length} origin dexes
            {gamesComplete > 0 ? ` · ${gamesComplete} complete` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {gameStats.map(({ game, caught: gCaught, total: gTotal, percent: gPercent, complete }) => (
              <li key={game.id}>
                <Link
                  to="/dex"
                  search={{ tab: 'games', game: game.id }}
                  className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2.5 transition hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GameLogo logo={game.logo} title={game.name} variant="wordmark" className="h-6 max-w-30 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{game.name}</span>
                        {game.kind === 'dlc' ? <Badge variant="secondary">DLC</Badge> : null}
                        {complete ? (
                          <Badge variant="secondary">
                            <CheckIcon data-icon="inline-start" aria-hidden />
                            Done
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {gCaught}/{gTotal}
                    </span>
                  </div>
                  <Progress value={gPercent} className="h-1.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Button variant="outline" render={<Link to="/dex" search={{ tab: 'games' }} />} nativeButton={false}>
            Open game dexes
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GiftIcon className="size-4" />
            Mystery gifts
            {giftBadge > 0 ? <Badge variant="secondary">{giftBadge}</Badge> : null}
          </CardTitle>
          <CardDescription>
            {activeGiftCount === 0
              ? 'No active gifts right now · live feed from Serebii'
              : unclaimedGiftCount > 0
                ? `${unclaimedGiftCount} unclaimed of ${activeGiftCount} active`
                : `${activeGiftCount} active · all claimed`}
            {endingSoon.length > 0 ? ` · ${endingSoon.length} ending soon` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link to="/gifts" />} nativeButton={false} className="w-full">
            View gifts
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
