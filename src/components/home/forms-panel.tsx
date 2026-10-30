import { Link } from '@tanstack/react-router';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ExpandIcon, EyeIcon, GlobeIcon, SparklesIcon, ZapIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { PokemonSprite } from '@/components/pokemon-sprite';
import { Badge } from '@/components/ui/badge';
import { useDexStore } from '@/lib/store';
import {
  biggestHolesAcross,
  formProgressList,
  formViewForDimension,
  type FormDimension,
  type FormHole,
} from '@/lib/form-stats';
import type { DexBox, SpriteStyle } from '@/lib/types';

const chartConfig = {
  percent: {
    label: 'Complete',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const DIMENSION_ICON: Record<FormDimension, typeof SparklesIcon> = {
  shiny: SparklesIcon,
  alpha: EyeIcon,
  mega: ZapIcon,
  gmax: ExpandIcon,
  regional: GlobeIcon,
};

const DIMENSION_CLASS: Record<FormDimension, string> = {
  shiny: 'text-amber-500',
  alpha: 'text-red-500',
  mega: 'text-violet-500',
  gmax: 'text-rose-500',
  regional: 'text-sky-500',
};

type FormsPanelProps = {
  boxes: DexBox[];
  spriteStyle: SpriteStyle;
  flags: {
    shinyByKey: Record<string, boolean>;
    alphaByKey: Record<string, boolean>;
    megaByKey: Record<string, boolean>;
    gmaxByKey: Record<string, boolean>;
    regionalByKey: Record<string, boolean>;
  };
};

function HoleChip({ hole, spriteStyle }: { hole: FormHole; spriteStyle: SpriteStyle }) {
  const setPref = useDexStore((s) => s.setPref);
  const Icon = DIMENSION_ICON[hole.dimension];

  return (
    <Link
      to="/pokemon/$id"
      params={{ id: String(hole.slot.id) }}
      onClick={() => setPref('formView', formViewForDimension(hole.dimension))}
      className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 transition hover:border-primary/40 hover:bg-muted/40"
    >
      <PokemonSprite
        id={hole.slot.id}
        style={spriteStyle}
        variant={hole.dimension === 'shiny' ? 'shiny' : 'default'}
        width={36}
        height={36}
        className="size-9"
      />
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{hole.slot.name}</span>
      <Icon className={`size-3.5 shrink-0 ${DIMENSION_CLASS[hole.dimension]}`} aria-hidden />
    </Link>
  );
}

export function FormsPanel({ boxes, spriteStyle, flags }: FormsPanelProps) {
  const setPref = useDexStore((s) => s.setPref);
  const progress = formProgressList(boxes, flags);
  const holes = biggestHolesAcross(boxes, flags, 10);
  const chartData = progress.map((row) => ({
    dimension: row.label,
    percent: row.percent,
    done: row.done,
    total: row.total,
    fill: 'var(--color-percent)',
  }));

  return (
    <Card className="animate-in fade-in-0 duration-700">
      <CardHeader className="gap-2">
        <CardTitle>Form completion</CardTitle>
        <CardDescription>Shiny, alpha, mega, gmax, and regional — % of eligible species</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <ChartContainer config={chartConfig} className="aspect-auto h-52 w-full" initialDimension={{ width: 480, height: 208 }}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} />
            <YAxis dataKey="dimension" type="category" width={72} tickLine={false} axisLine={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const row = item?.payload as { done?: number; total?: number } | undefined;
                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">Complete</span>
                        <span className="font-mono tabular-nums text-foreground">
                          {row?.done ?? 0}/{row?.total ?? 0} ({String(value)}%)
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar dataKey="percent" radius={4} />
          </BarChart>
        </ChartContainer>

        <div className="flex flex-wrap gap-2">
          {progress.map((row) => {
            const Icon = DIMENSION_ICON[row.id];
            return (
              <Link
                key={row.id}
                to="/dex"
                search={{ tab: 'national' }}
                onClick={() => setPref('formView', formViewForDimension(row.id))}
              >
                <Badge variant="outline" className="cursor-pointer">
                  <Icon data-icon="inline-start" className={DIMENSION_CLASS[row.id]} />
                  {row.done}/{row.total} {row.label.toLowerCase()}
                </Badge>
              </Link>
            );
          })}
        </div>

        {holes.length > 0 ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Biggest holes</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {holes.map((hole) => (
                <HoleChip key={`${hole.dimension}-${hole.slot.key}`} hole={hole} spriteStyle={spriteStyle} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">All tracked form dimensions are complete — nice work.</p>
        )}
      </CardContent>
    </Card>
  );
}
