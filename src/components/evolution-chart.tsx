import { Link } from '@tanstack/react-router';
import type { EvoNode } from '@/lib/evolution';
import type { GameId, SpriteStyle } from '@/lib/types';
import { PokemonSprite } from '@/components/pokemon-sprite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item, ItemContent, ItemTitle } from '@/components/ui/item';
import { ArrowRightIcon } from 'lucide-react';

type PokemonNavSearch = { from?: 'games'; game?: GameId };

function Stage({
  node,
  spriteStyle,
  search,
  onSelectSpecies,
}: {
  node: EvoNode;
  spriteStyle: SpriteStyle;
  search?: PokemonNavSearch;
  onSelectSpecies?: (id: number) => void;
}) {
  const render =
    onSelectSpecies != null ? (
      <button type="button" onClick={() => onSelectSpecies(node.id)} aria-label={`${node.name} details`} />
    ) : (
      <Link to="/pokemon/$id" params={{ id: String(node.id) }} search={search} />
    );

  return (
    <Item variant="outline" size="sm" render={render} className="w-28 flex-col items-center">
      <PokemonSprite id={node.id} style={spriteStyle} width={80} height={80} className="size-20" />
      <ItemContent className="w-full items-center text-center">
        <ItemTitle className="w-full justify-center normal-case tracking-normal">{node.name}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

function MethodLabel({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 text-muted-foreground">
      <ArrowRightIcon />
      <span className="max-w-24 text-center text-xs font-semibold leading-tight">{label}</span>
    </div>
  );
}

function Branch({
  node,
  spriteStyle,
  search,
  onSelectSpecies,
}: {
  node: EvoNode;
  spriteStyle: SpriteStyle;
  search?: PokemonNavSearch;
  onSelectSpecies?: (id: number) => void;
}) {
  if (node.evolvesTo.length === 0) {
    return <Stage node={node} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />;
  }

  if (node.evolvesTo.length === 1) {
    const child = node.evolvesTo[0]!;
    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Stage node={node} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />
        {child.methodFromParent ? <MethodLabel label={child.methodFromParent.label} /> : null}
        <Branch node={child} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Stage node={node} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />
      <div className="flex flex-col gap-3 border-l border-border pl-2">
        {node.evolvesTo.map((child) => (
          <div key={child.id} className="flex flex-wrap items-center gap-1">
            {child.methodFromParent ? <MethodLabel label={child.methodFromParent.label} /> : null}
            <Branch node={child} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvolutionChart({
  chain,
  spriteStyle,
  search,
  onSelectSpecies,
}: {
  chain: EvoNode;
  spriteStyle: SpriteStyle;
  search?: PokemonNavSearch;
  onSelectSpecies?: (id: number) => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Evolution</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex min-w-min justify-center md:justify-start">
          <Branch node={chain} spriteStyle={spriteStyle} search={search} onSelectSpecies={onSelectSpecies} />
        </div>
      </CardContent>
    </Card>
  );
}
