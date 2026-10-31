import { cn } from '@/lib/utils';
import type { SpriteStyle } from '@/lib/types';
import { spriteFallbackChain, spriteImageRendering, spriteUrl, type SpriteVariant } from '@/lib/sprites';

type PokemonSpriteProps = {
  id: number;
  style: SpriteStyle;
  shiny?: boolean;
  variant?: SpriteVariant;
  slug?: string;
  /** PokéAPI form id for regional (or other) forms. */
  formId?: number;
  /**
   * Explicit pixel sprite URL (e.g. cosmetic form boxes). When set, bypasses
   * formId→pokemon-id mapping which breaks Vivillon/Unown/etc.
   */
  src?: string;
  /** Explicit shiny pixel sprite URL paired with `src`. */
  srcShiny?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
};

function homeStyleUrl(pixelUrl: string): string {
  if (pixelUrl.includes('/other/home/')) return pixelUrl;
  if (pixelUrl.includes('/sprites/pokemon/shiny/')) {
    return pixelUrl.replace('/sprites/pokemon/shiny/', '/sprites/pokemon/other/home/shiny/');
  }
  return pixelUrl.replace('/sprites/pokemon/', '/sprites/pokemon/other/home/');
}

/**
 * Species art from PokeAPI / Showdown — pixel, HOME 3D, or mega/gmax/regional art.
 */
export function PokemonSprite({
  id,
  style,
  shiny = false,
  variant = 'default',
  slug,
  formId,
  src,
  srcShiny,
  alt = '',
  width = 80,
  height = 80,
  className,
  loading = 'lazy',
}: PokemonSpriteProps) {
  const opts = { shiny, variant, slug, formId };
  const explicit = shiny ? (srcShiny ?? src) : src;
  const primary = explicit ? (style === 'home' ? homeStyleUrl(explicit) : explicit) : spriteUrl(id, style, opts);
  const fallbacks = explicit
    ? [
        ...(style === 'home' && explicit ? [explicit] : []),
        ...(src && src !== explicit ? [src] : []),
        spriteUrl(id, style, { shiny, variant: 'default', slug }),
      ].filter(Boolean)
    : spriteFallbackChain(id, style, opts);

  return (
    <img
      key={`${id}-${style}-${variant}-${shiny ? 's' : 'n'}-${slug ?? ''}-${formId ?? ''}-${primary}`}
      src={primary}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      data-fallback-index={0}
      className={cn('object-contain', className)}
      style={{ imageRendering: spriteImageRendering(style, variant) }}
      onError={(e) => {
        const img = e.currentTarget;
        const idx = Number(img.dataset.fallbackIndex ?? 0);
        const next = fallbacks[idx];
        if (!next) return;
        img.dataset.fallbackIndex = String(idx + 1);
        img.src = next;
        img.style.imageRendering =
          next.includes('/sprites/pokemon/') &&
          !next.includes('/other/') &&
          !next.includes('showdown') &&
          !next.includes('play.pokemonshowdown')
            ? 'pixelated'
            : 'auto';
      }}
    />
  );
}
