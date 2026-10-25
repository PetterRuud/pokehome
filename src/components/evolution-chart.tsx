import { Link } from "@tanstack/react-router";
import type { EvoNode } from "@/lib/evolution";
import type { SpriteStyle } from "@/lib/types";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { ArrowRightIcon } from "lucide-react";

function Stage({ node, spriteStyle }: { node: EvoNode; spriteStyle: SpriteStyle }) {
  return (
    <Link
      to="/pokemon/$id"
      params={{ id: String(node.id) }}
      className="flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-2.5 text-center transition hover:border-primary/40"
    >
      <PokemonSprite id={node.id} style={spriteStyle} width={80} height={80} className="size-20" />
      <span className="text-sm font-medium leading-tight">{node.name}</span>
    </Link>
  );
}

function MethodLabel({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 text-muted-foreground">
      <ArrowRightIcon className="size-4" />
      <span className="max-w-24 text-center text-xs font-semibold leading-tight">{label}</span>
    </div>
  );
}

function Branch({ node, spriteStyle }: { node: EvoNode; spriteStyle: SpriteStyle }) {
  if (node.evolvesTo.length === 0) {
    return <Stage node={node} spriteStyle={spriteStyle} />;
  }

  if (node.evolvesTo.length === 1) {
    const child = node.evolvesTo[0]!;
    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        <Stage node={node} spriteStyle={spriteStyle} />
        {child.methodFromParent ? <MethodLabel label={child.methodFromParent.label} /> : null}
        <Branch node={child} spriteStyle={spriteStyle} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Stage node={node} spriteStyle={spriteStyle} />
      <div className="flex flex-col gap-3 border-l border-border pl-2">
        {node.evolvesTo.map((child) => (
          <div key={child.id} className="flex flex-wrap items-center gap-1">
            {child.methodFromParent ? <MethodLabel label={child.methodFromParent.label} /> : null}
            <Branch node={child} spriteStyle={spriteStyle} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EvolutionChart({
  chain,
  spriteStyle,
}: {
  chain: EvoNode;
  spriteStyle: SpriteStyle;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold">Evolution</p>
      <div className="flex min-w-min justify-center md:justify-start">
        <Branch node={chain} spriteStyle={spriteStyle} />
      </div>
    </div>
  );
}
