import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { GameLogo } from "@/components/game-logo";
import { berryDisplayName, berrySpriteUrl } from "@/lib/berries";
import {
  getDefaultTipFamilyId,
  getTipFamilies,
  getTips,
} from "@/lib/trainer-tips";
import type { TipBerry, TipBlock, TipRecipe, TipSection } from "@/data/trainer-tips";
import { ExternalLinkIcon } from "lucide-react";

type TipsSearch = {
  game?: string;
};

export const Route = createFileRoute("/tips")({
  validateSearch: (search: Record<string, unknown>): TipsSearch => {
    const families = getTipFamilies();
    const raw =
      typeof search.game === "string" && search.game.length > 0 ? search.game : undefined;
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
      to: "/tips",
      search: { game: gameId },
      replace: true,
    });
  }, [gameId, search.game, navigate]);

  function selectGame(id: string) {
    void navigate({
      to: "/tips",
      search: { game: id },
      replace: true,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trainer tips</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated cheatsheets by game family — donuts, berries, and mission shortcuts.
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
            <GameLogo
              logo={f.logo}
              title={f.name}
              variant="wordmark"
              className="h-7 max-w-full"
            />
            <span className="text-center text-xs leading-tight font-medium">{f.short}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {!tips || tips.sections.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No tips yet</EmptyTitle>
            <EmptyDescription>
              Nothing curated for {family?.name ?? "this game"} yet. Check back later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-8">
          {tips.sections.map((section) => (
            <TipSectionView key={section.title} section={section} />
          ))}
          {tips.sourceUrl ? (
            <div className="flex flex-col gap-4">
              <Separator />
              <p className="text-xs text-muted-foreground">
                Curated from{" "}
                <a
                  href={tips.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Game8 donut recipes
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
                {" · "}
                <a
                  href="https://game8.co/games/Pokemon-Legends-Z-A/archives/563812"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  special donuts
                  <ExternalLinkIcon data-icon="inline-end" aria-hidden />
                </a>
                {" · "}
                <a
                  href="https://game8.co/games/Pokemon-Legends-Z-A/archives/570326"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
                >
                  story walkthrough
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
  if (block.type === "text") {
    return <p className="text-sm text-muted-foreground">{block.body}</p>;
  }

  if (block.type === "bullets") {
    return (
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
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

function RecipeRow({ recipe }: { recipe: TipRecipe }) {
  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      {recipe.label ? (
        <p className="text-sm font-semibold leading-snug">{recipe.label}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {recipe.ingredients.map((berry, i) => (
          <BerryChip key={`${berry.id}-${berry.optional ? "opt" : i}`} berry={berry} />
        ))}
      </div>
      {recipe.note ? (
        <p className="text-xs text-muted-foreground">{recipe.note}</p>
      ) : null}
    </li>
  );
}

function BerryChip({ berry }: { berry: TipBerry }) {
  const name = berryDisplayName(berry);
  return (
    <Badge variant={berry.optional ? "ghost" : "outline"} title={name}>
      <img
        src={berrySpriteUrl(berry.id)}
        alt=""
        width={24}
        height={24}
        className="size-6"
        style={{ imageRendering: "pixelated" }}
        loading="lazy"
      />
      ×{berry.count}{" "}
      {berry.hyper ? `Hyper ${capitalize(berry.id)}` : capitalize(berry.id)}
      {berry.optional ? " ?" : ""}
    </Badge>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
