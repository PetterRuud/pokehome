import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { GameLogo } from '@/components/game-logo';
import { DonutCalculator } from '@/components/donut-calculator';
import { PokemonSprite } from '@/components/pokemon-sprite';
import { berryDisplayName, berrySpriteUrl } from '@/lib/berries';
import {
  moveType,
  parsePokemonType,
  typeBadgeClass,
  typeIconClass,
  typeIconUrl,
  type PokemonType,
} from '@/lib/move-types';
import { getDefaultTipFamilyId, getTipFamilies, getTips } from '@/lib/trainer-tips';
import { cn } from '@/lib/utils';
import type {
  TipBerry,
  TipBlock,
  TipCounterBuild,
  TipMegaFight,
  TipRecipe,
  TipSection,
  TipSpecies,
} from '@/data/trainer-tips';
import { ExternalLinkIcon } from 'lucide-react';

type TipsSearch = {
  game?: string;
};

export const Route = createFileRoute('/tips')({
  validateSearch: (search: Record<string, unknown>): TipsSearch => {
    const families = getTipFamilies();
    const raw = typeof search.game === 'string' && search.game.length > 0 ? search.game : undefined;
    const game = raw && families.some((f) => f.id === raw) ? raw : undefined;
    return game ? { game } : {};
  },
  component: TipsPage,
});

function TipsPage() {
  const families = getTipFamilies();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const gameId = search.game ?? getDefaultTipFamilyId();
  const family = families.find((f) => f.id === gameId) ?? families[0];
  const tips = family ? getTips(family.id) : undefined;

  useEffect(() => {
    if (search.game === gameId) return;
    void navigate({
      to: '/tips',
      search: { game: gameId },
      replace: true,
    });
  }, [gameId, search.game, navigate]);

  function selectGame(id: string) {
    void navigate({
      to: '/tips',
      search: { game: id },
      replace: true,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trainer tips</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated cheatsheets by game family — donuts, berries, Rogue Mega counters, and mission shortcuts.
        </p>
      </div>

      <ToggleGroup
        variant="outline"
        size="sm"
        value={family ? [family.id] : []}
        onValueChange={(next) => {
          const id = next[0];
          if (id) selectGame(id);
        }}
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
      >
        {families.map((f) => (
          <ToggleGroupItem
            key={f.id}
            value={f.id}
            disabled={!f.hasTips}
            aria-label={f.name}
            title={f.name}
            className="h-auto min-w-0 flex-col gap-1.5 whitespace-normal px-2.5 py-2.5"
          >
            <GameLogo logo={f.logo} title={f.name} variant="wordmark" className="h-7 max-w-full" />
            <span className="text-center text-xs leading-tight font-medium">{f.short}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {!tips || tips.sections.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No tips yet</EmptyTitle>
            <EmptyDescription>
              Nothing curated for {family?.name ?? 'this game'} yet. Check back later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {gameId === 'za' ? <DonutCalculator /> : null}
          {tips.sections.map((section) => (
            <TipSectionView key={section.title} section={section} />
          ))}
          {tips.sourceUrl ? (
            <div className="flex flex-col gap-4">
              <Separator />
              <p className="text-xs text-muted-foreground">
                Curated from{' '}
                <a
                  href={tips.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Game8 donut recipes
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
                {' · '}
                <a
                  href="https://game8.co/games/Pokemon-Legends-Z-A/archives/563812"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  special donuts
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
                {' · '}
                <a
                  href="https://game8.co/games/Pokemon-Legends-Z-A/archives/570326"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  story walkthrough
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
                {' · '}
                <a
                  href="https://game8.co/games/Pokemon-Legends-Z-A/archives/571819"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Rogue Mega counters
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TipSectionView({ section }: { section: TipSection }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
      {section.blocks.map((block, i) => (
        <TipBlockView key={`${section.title}-${i}`} block={block} />
      ))}
    </section>
  );
}

function TipBlockView({ block }: { block: TipBlock }) {
  if (block.type === 'text') {
    return <p className="text-sm text-muted-foreground">{block.body}</p>;
  }

  if (block.type === 'bullets') {
    return (
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === 'mega-fights') {
    return (
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold">{block.title}</h3>
          <p className="text-xs text-muted-foreground">{block.goal}</p>
        </div>
        <ul className="divide-y divide-border rounded-md border border-border">
          {block.fights.map((fight) => (
            <MegaFightRow key={fight.label} fight={fight} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="text-sm font-semibold">{block.title}</h3>
        <p className="text-xs text-muted-foreground">{block.goal}</p>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {block.recipes.map((recipe, i) => (
          <RecipeRow key={recipe.label ?? `${block.title}-${i}`} recipe={recipe} />
        ))}
      </ul>
    </div>
  );
}

const SHOWDOWN_DEX = 'https://play.pokemonshowdown.com/sprites/dex';

function TipSpeciesArt({ species, size = 40 }: { species: TipSpecies; size?: number }) {
  return (
    <PokemonSprite
      id={species.id}
      style="pixel"
      variant={species.mega ? 'mega' : 'default'}
      slug={species.slug}
      src={species.spriteSlug ? `${SHOWDOWN_DEX}/${species.spriteSlug}.png` : undefined}
      alt=""
      width={size}
      height={size}
      className={size <= 32 ? 'size-8 shrink-0' : 'size-10 shrink-0'}
    />
  );
}

function TypeBadge({
  label,
  type: typeOverride,
  title,
}: {
  label: string;
  type?: PokemonType | null;
  title?: string;
}) {
  const type = typeOverride === undefined ? parsePokemonType(label) : typeOverride;
  if (!type) {
    return (
      <Badge variant="secondary" title={title}>
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn('gap-1 shadow-none', typeBadgeClass(type))}
      title={title ?? `${type} · ${label}`}
    >
      <img
        src={typeIconUrl(type)}
        alt=""
        data-icon="inline-start"
        className={cn('size-3', typeIconClass(type))}
      />
      {label}
    </Badge>
  );
}

function MegaFightRow({ fight }: { fight: TipMegaFight }) {
  return (
    <li className="flex flex-col gap-3 px-3 py-3">
      <div className="flex items-start gap-3">
        <TipSpeciesArt species={fight.boss} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{fight.label}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {fight.types.map((type, i) => (
              <TypeBadge key={`type-${i}-${type}`} label={type} />
            ))}
            <span className="text-xs font-medium text-muted-foreground">Weak</span>
            {fight.weaknesses.map((weakness, i) => (
              <TypeBadge key={`weak-${i}-${weakness}`} label={weakness} />
            ))}
          </div>
          {fight.note ? <p className="mt-1.5 text-xs text-muted-foreground">{fight.note}</p> : null}
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 pl-1">
        {fight.counters.map((counter) => (
          <CounterBuildRow key={`${fight.label}-${counter.pokemon.slug}`} counter={counter} />
        ))}
      </ul>
    </li>
  );
}

function CounterBuildRow({ counter }: { counter: TipCounterBuild }) {
  const { pokemon, moves, note } = counter;
  return (
    <li className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 sm:w-40 sm:shrink-0">
        <TipSpeciesArt species={pokemon} size={32} />
        <span className="truncate text-sm font-medium">{pokemon.name}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1.5">
          {moves.map((move) => (
            <TypeBadge key={move} label={move} type={moveType(move)} />
          ))}
        </div>
        {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </div>
    </li>
  );
}

function RecipeRow({ recipe }: { recipe: TipRecipe }) {
  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      {recipe.label ? <p className="text-sm font-semibold leading-snug">{recipe.label}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        {recipe.ingredients.map((berry, i) => (
          <BerryChip key={`${berry.id}-${berry.optional ? 'opt' : i}`} berry={berry} />
        ))}
      </div>
      {recipe.note ? <p className="text-xs text-muted-foreground">{recipe.note}</p> : null}
    </li>
  );
}

function BerryChip({ berry }: { berry: TipBerry }) {
  const name = berryDisplayName(berry);
  return (
    <Badge variant={berry.optional ? 'ghost' : 'outline'} title={name}>
      <img
        src={berrySpriteUrl(berry.id, { hyper: berry.hyper })}
        alt=""
        style={berry.hyper ? undefined : { imageRendering: 'pixelated' }}
        loading="lazy"
      />
      ×{berry.count} {capitalize(berry.id)}
      {berry.optional ? ' ?' : ''}
    </Badge>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
