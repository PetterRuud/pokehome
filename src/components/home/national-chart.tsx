import { Link } from '@tanstack/react-router';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { PokeballIcon } from '@/components/pokeball-logo';

const chartConfig = {
  home: {
    label: 'In HOME',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

type NationalChartProps = {
  home: number;
  total: number;
  percent: number;
  caughtCount: number;
};

export function NationalChart({ home, total, percent, caughtCount }: NationalChartProps) {
  const chartData = [{ name: 'home', value: percent, fill: 'var(--color-home)' }];

  return (
    <Card className="animate-in fade-in-0 duration-500">
      <CardHeader className="gap-2">
        <CardTitle>National progress</CardTitle>
        <CardDescription>
          {home} / {total} in HOME
          {caughtCount > 0 ? ` · ${caughtCount} caught` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="mx-auto w-full max-w-[220px]">
          <ChartContainer
            config={chartConfig}
            className="aspect-square w-full"
            initialDimension={{ width: 220, height: 220 }}
          >
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={90 - Math.max(8, (percent / 100) * 360)}
              innerRadius={72}
              outerRadius={98}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-muted last:fill-background"
                polarRadius={[78, 66]}
              />
              <RadialBar dataKey="value" background cornerRadius={6} />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) - 6}
                            className="fill-foreground text-3xl font-bold tabular-nums"
                          >
                            {percent}%
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-muted-foreground text-xs">
                            complete
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </PolarRadiusAxis>
            </RadialBarChart>
          </ChartContainer>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{percent}% complete</Badge>
          <Badge variant="outline">{total - home} missing</Badge>
          {caughtCount > 0 ? (
            <Badge variant="outline">
              <PokeballIcon data-icon="inline-start" className="size-3.5" />
              {caughtCount} caught
            </Badge>
          ) : null}
        </div>

        <Button render={<Link to="/dex" />} nativeButton={false}>
          Open dex
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  );
}
