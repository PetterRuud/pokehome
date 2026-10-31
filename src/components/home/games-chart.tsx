import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GameLogo } from '@/components/game-logo';
import type { GameDex } from '@/lib/types';

export type GameStatRow = {
  game: GameDex;
  caught: number;
  total: number;
  percent: number;
  complete: boolean;
};

type GamesChartProps = {
  gameStats: GameStatRow[];
  gamesComplete: number;
};

export function GamesChart({ gameStats, gamesComplete }: GamesChartProps) {
  return (
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
          {gameStats.map(({ game, caught, total, percent, complete }) => (
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
                        <Badge variant="secondary" className="border-transparent bg-emerald-600/15 text-emerald-600">
                          <CheckIcon data-icon="inline-start" aria-hidden />
                          Done
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {caught}/{total}
                  </span>
                </div>
                <Progress value={percent} className="h-1.5" />
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
  );
}
