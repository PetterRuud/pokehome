import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { FormsPanel } from '@/components/home/forms-panel';
import { GamesChart } from '@/components/home/games-chart';
import { GiftsCard } from '@/components/home/gifts-card';
import { NationalChart } from '@/components/home/national-chart';
import { PokeballLogo } from '@/components/pokeball-logo';
import { useDexStore } from '@/lib/store';
import { countFlag, countGameProgress, countProgress } from '@/lib/dex-stats';
import { categorizeGifts } from '@/lib/gifts';
import { getGames } from '@/lib/games';
import { loadGiftFeed } from '@/server/gifts';
import nationalDex from '@/data/national-dex.json';

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
  const homeByGame = useDexStore((s) => s.homeByGame);
  const claimedGiftIds = useDexStore((s) => s.claimedGiftIds);

  const { total, caught: home, percent } = countProgress(nationalDex.boxes, homeByKey);
  const caughtCount = countFlag(caughtByKey);

  const gameStats = useMemo(() => {
    return getGames().map((game) => {
      const progress = countGameProgress(game.boxes, homeByGame[game.id]);
      return {
        game,
        ...progress,
        complete: progress.total > 0 && progress.caught === progress.total,
      };
    });
  }, [homeByGame]);

  const gamesComplete = gameStats.filter((g) => g.complete).length;
  const { active, endingSoon } = categorizeGifts(feed.gifts);
  const liveGifts = [...endingSoon, ...active];
  const activeGiftCount = liveGifts.length;
  const unclaimedGiftCount = liveGifts.filter((g) => !claimedGiftIds.includes(g.id)).length;
  const giftBadge = unclaimedGiftCount > 0 ? unclaimedGiftCount : activeGiftCount;

  const formFlags = useMemo(
    () => ({
      shinyByKey,
      alphaByKey,
      megaByKey,
      gmaxByKey,
      regionalByKey,
    }),
    [shinyByKey, alphaByKey, megaByKey, gmaxByKey, regionalByKey],
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section className="flex flex-col gap-3 animate-in fade-in-0 duration-300">
        <PokeballLogo size="lg" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Your living dex</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Track HOME-style boxes offline. Sign in to sync across devices — conflicts ask before overwrite.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <NationalChart home={home} total={total} percent={percent} caughtCount={caughtCount} />
        <FormsPanel boxes={nationalDex.boxes} flags={formFlags} />
      </div>

      <GamesChart gameStats={gameStats} gamesComplete={gamesComplete} />

      <GiftsCard
        activeGiftCount={activeGiftCount}
        unclaimedGiftCount={unclaimedGiftCount}
        endingSoonCount={endingSoon.length}
        giftBadge={giftBadge}
      />
    </div>
  );
}
