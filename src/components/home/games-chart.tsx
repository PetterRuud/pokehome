import { Link } from '@tanstack/react-router';
import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { GameLogo } from '@/components/game-logo';
import type { GameDex } from '@/lib/types';

const chartConfig = {
  percent: {
    label: 'Complete',
    color: 'var(--chart-3)',
  },
  done: {
    label: 'Done',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

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
  const sorted = [...gameStats].sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1;
    return a.percent - b.percent;
  });

  const chartData = sorted.map((row) => ({
    id: row.game.id,
    name: row.game.short || row.game.name,
    percent: row.percent,
    caught: row.caught,
    total: row.total,
    complete: row.complete,
    fill: row.complete ? 'var(--color-done)' : 'var(--color-percent)',
  }));

  const chartHeight = Math.max(200, chartData.length * 28);

  return (
    <Card className="animate-in fade-in-0 slide-in-from-bottom-2 duration-700">
      <CardHeader className="gap-2">
        <CardTitle>Game dexes</CardTitle>
        <CardDescription>
          {gameStats.length} origin dexes
          {gamesComplete > 0 ? ` · ${gamesComplete} complete` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto w-full"
          style={{ height: chartHeight }}
          initialDimension={{ width: 480, height: chartHeight }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              dataKey="name"
              type="category"
              width={96}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as { name?: string } | undefined;
                    return row?.name ?? '';
                  }}
                  formatter={(value, _name, item) => {
                    const row = item?.payload as { caught?: number; total?: number; complete?: boolean } | undefined;
                    return (
                      <div className="flex w-full flex-col gap-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-mono tabular-nums">
                            {row?.caught ?? 0}/{row?.total ?? 0} ({String(value)}%)
                          </span>
                        </div>
                        {row?.complete ? <span className="text-emerald-600">Complete</span> : null}
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="percent" radius={4}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <ul className="flex flex-col gap-2">
          {sorted.slice(0, 6).map(({ game, caught, total, percent, complete }) => (
            <li key={game.id}>
              <Link
                to="/dex"
                search={{ tab: 'games', game: game.id }}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition hover:border-primary/40 hover:bg-muted/40"
              >
                <GameLogo logo={game.logo} title={game.name} variant="wordmark" className="h-5 max-w-24 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{game.name}</span>
                {complete ? (
                  <Badge variant="secondary" className="border-transparent bg-emerald-600/15 text-emerald-600">
                    <CheckIcon data-icon="inline-start" aria-hidden />
                    Done
                  </Badge>
                ) : (
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {caught}/{total} · {percent}%
                  </span>
                )}
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
