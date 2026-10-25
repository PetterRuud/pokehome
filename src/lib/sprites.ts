import { formIdsForSprite, formSpriteSlug } from "@/lib/form-variants";
import type { SpriteStyle } from "@/lib/types";

const BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SHOWDOWN_DEX = "https://play.pokemonshowdown.com/sprites/dex";

export type SpriteVariant = "default" | "shiny" | "mega" | "gmax" | "regional";

type SpriteOpts = {
  shiny?: boolean;
  variant?: SpriteVariant;
  /** Base species slug, e.g. "venusaur". */
  slug?: string;
  /** National dex id — used to resolve mega/gmax/regional form art. */
  nationalId?: number;
  /** Explicit PokéAPI form id (e.g. game-dex regional slot). */
  formId?: number;
};

function pokeApiFormSprite(formId: number, shiny: boolean): string {
  return shiny ? `${BASE}/shiny/${formId}.png` : `${BASE}/${formId}.png`;
}

function showdownDexUrl(formSlug: string): string {
  return `${SHOWDOWN_DEX}/${formSlug}.png`;
}

/** Resolve display art for a national dex id. */
export function spriteUrl(id: number, style: SpriteStyle, opts: SpriteOpts = {}): string {
  const { shiny = false, variant = "default", slug, nationalId = id, formId } = opts;

  if (variant === "mega" || variant === "gmax") {
    const formSlug = formSpriteSlug(nationalId, variant, slug);
    if (formSlug) return showdownDexUrl(formSlug);
    const formIds = formIdsForSprite(nationalId, variant);
    if (formIds[0]) return pokeApiFormSprite(formIds[0], false);
  }

  if (variant === "regional") {
    const formIds = formIdsForSprite(nationalId, "regional");
    const resolved = formId ?? formIds[0];
    if (resolved) {
      if (style === "home") {
        return shiny
          ? `${BASE}/other/home/shiny/${resolved}.png`
          : `${BASE}/other/home/${resolved}.png`;
      }
      return pokeApiFormSprite(resolved, shiny);
    }
  }

  const spriteId = formId ?? id;

  if (style === "home") {
    return shiny
      ? `${BASE}/other/home/shiny/${spriteId}.png`
      : `${BASE}/other/home/${spriteId}.png`;
  }
  return shiny ? `${BASE}/shiny/${spriteId}.png` : `${BASE}/${spriteId}.png`;
}

/** Ordered fallbacks when a preferred sprite 404s. */
export function spriteFallbackChain(
  id: number,
  style: SpriteStyle,
  opts: SpriteOpts = {},
): string[] {
  const { shiny = false, variant = "default", slug, nationalId = id, formId } = opts;
  const chain: string[] = [];

  if (variant === "mega" || variant === "gmax") {
    const entrySlug = formSpriteSlug(nationalId, variant, slug);
    const formIds = formIdsForSprite(nationalId, variant);

    // Alternate Showdown slugs (e.g. -megay after -megax primary)
    if (entrySlug?.endsWith("-megax")) {
      chain.push(showdownDexUrl(entrySlug.replace(/-megax$/, "-megay")));
    } else if (entrySlug?.endsWith("-mega") && slug) {
      chain.push(showdownDexUrl(`${slug}-megax`));
      chain.push(showdownDexUrl(`${slug}-megay`));
    }

    for (const fid of formIds) {
      chain.push(pokeApiFormSprite(fid, false));
    }

    chain.push(spriteUrl(id, style, { shiny: false, variant: "default", slug }));
    if (style === "home") {
      chain.push(`${BASE}/other/official-artwork/${id}.png`);
    }
    chain.push(`${BASE}/${id}.png`);
    return chain;
  }

  if (variant === "regional" || formId) {
    const formIds = formId
      ? [formId, ...formIdsForSprite(nationalId, "regional").filter((f) => f !== formId)]
      : formIdsForSprite(nationalId, "regional");
    for (const fid of formIds) {
      if (style === "home") {
        chain.push(shiny ? `${BASE}/other/home/shiny/${fid}.png` : `${BASE}/other/home/${fid}.png`);
        chain.push(`${BASE}/other/official-artwork/${fid}.png`);
      }
      chain.push(pokeApiFormSprite(fid, shiny));
      if (shiny) chain.push(pokeApiFormSprite(fid, false));
    }
    chain.push(spriteUrl(id, style, { shiny, variant: "default", slug }));
    return chain;
  }

  const spriteId = id;

  if (style === "home") {
    chain.push(
      shiny
        ? `${BASE}/other/official-artwork/shiny/${spriteId}.png`
        : `${BASE}/other/official-artwork/${spriteId}.png`,
    );
  }
  if (shiny) {
    chain.push(`${BASE}/shiny/${spriteId}.png`);
    chain.push(`${BASE}/${spriteId}.png`);
  } else if (style === "home") {
    chain.push(`${BASE}/${spriteId}.png`);
  }
  return chain;
}

/** @deprecated use spriteFallbackChain */
export function spriteFallbackUrl(id: number, style: SpriteStyle, shiny = false): string | null {
  return spriteFallbackChain(id, style, { shiny })[0] ?? null;
}

export function spriteImageRendering(
  style: SpriteStyle,
  variant: SpriteVariant = "default",
): "pixelated" | "auto" {
  if (variant === "mega" || variant === "gmax") return "auto";
  return style === "pixel" ? "pixelated" : "auto";
}
