import { cn } from "@/lib/utils";
import type { SpriteStyle } from "@/lib/types";
import {
  spriteFallbackChain,
  spriteImageRendering,
  spriteUrl,
  type SpriteVariant,
} from "@/lib/sprites";

type PokemonSpriteProps = {
  id: number;
  style: SpriteStyle;
  shiny?: boolean;
  variant?: SpriteVariant;
  slug?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * Species art from PokeAPI / Showdown — pixel, HOME 3D, or mega/gmax dex art.
 */
export function PokemonSprite({
  id,
  style,
  shiny = false,
  variant = "default",
  slug,
  alt = "",
  width = 80,
  height = 80,
  className,
  loading = "lazy",
}: PokemonSpriteProps) {
  const opts = { shiny, variant, slug };
  const primary = spriteUrl(id, style, opts);
  const fallbacks = spriteFallbackChain(id, style, opts);

  return (
    <img
      key={`${id}-${style}-${variant}-${shiny ? "s" : "n"}-${slug ?? ""}`}
      src={primary}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      data-fallback-index={0}
      className={cn("object-contain", className)}
      style={{ imageRendering: spriteImageRendering(style, variant) }}
      onError={(e) => {
        const img = e.currentTarget;
        const idx = Number(img.dataset.fallbackIndex ?? 0);
        const next = fallbacks[idx];
        if (!next) return;
        img.dataset.fallbackIndex = String(idx + 1);
        img.src = next;
        img.style.imageRendering =
          next.includes("/sprites/pokemon/") &&
          !next.includes("/other/") &&
          !next.includes("showdown") &&
          !next.includes("play.pokemonshowdown")
            ? "pixelated"
            : "auto";
      }}
    />
  );
}
