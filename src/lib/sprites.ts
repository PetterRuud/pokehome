import {
  formIdsForSprite,
  formSpriteSlug,
} from '@/lib/form-variants'
import type { SpriteStyle } from '@/lib/types'

const BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
const SHOWDOWN_DEX = 'https://play.pokemonshowdown.com/sprites/dex'

export type SpriteVariant = 'default' | 'shiny' | 'mega' | 'gmax'

type SpriteOpts = {
  shiny?: boolean
  variant?: SpriteVariant
  /** Base species slug, e.g. "venusaur". */
  slug?: string
  /** National dex id — used to resolve mega/gmax form art. */
  nationalId?: number
}

function pokeApiFormSprite(formId: number, shiny: boolean): string {
  return shiny ? `${BASE}/shiny/${formId}.png` : `${BASE}/${formId}.png`
}

function showdownDexUrl(formSlug: string): string {
  return `${SHOWDOWN_DEX}/${formSlug}.png`
}

/** Resolve display art for a national dex id. */
export function spriteUrl(
  id: number,
  style: SpriteStyle,
  opts: SpriteOpts = {},
): string {
  const { shiny = false, variant = 'default', slug, nationalId = id } = opts

  if (variant === 'mega' || variant === 'gmax') {
    const formSlug = formSpriteSlug(nationalId, variant, slug)
    if (formSlug) return showdownDexUrl(formSlug)
    const formIds = formIdsForSprite(nationalId, variant)
    if (formIds[0]) return pokeApiFormSprite(formIds[0], false)
  }

  if (style === 'home') {
    return shiny
      ? `${BASE}/other/home/shiny/${id}.png`
      : `${BASE}/other/home/${id}.png`
  }
  return shiny ? `${BASE}/shiny/${id}.png` : `${BASE}/${id}.png`
}

/** Ordered fallbacks when a preferred sprite 404s. */
export function spriteFallbackChain(
  id: number,
  style: SpriteStyle,
  opts: SpriteOpts = {},
): string[] {
  const { shiny = false, variant = 'default', slug, nationalId = id } = opts
  const chain: string[] = []

  if (variant === 'mega' || variant === 'gmax') {
    const entrySlug = formSpriteSlug(nationalId, variant, slug)
    const formIds = formIdsForSprite(nationalId, variant)

    // Alternate Showdown slugs (e.g. -megay after -megax primary)
    if (entrySlug?.endsWith('-megax')) {
      chain.push(showdownDexUrl(entrySlug.replace(/-megax$/, '-megay')))
    } else if (entrySlug?.endsWith('-mega') && slug) {
      chain.push(showdownDexUrl(`${slug}-megax`))
      chain.push(showdownDexUrl(`${slug}-megay`))
    }

    for (const formId of formIds) {
      chain.push(pokeApiFormSprite(formId, false))
    }

    chain.push(spriteUrl(id, style, { shiny: false, variant: 'default', slug }))
    if (style === 'home') {
      chain.push(`${BASE}/other/official-artwork/${id}.png`)
    }
    chain.push(`${BASE}/${id}.png`)
    return chain
  }

  if (style === 'home') {
    chain.push(
      shiny
        ? `${BASE}/other/official-artwork/shiny/${id}.png`
        : `${BASE}/other/official-artwork/${id}.png`,
    )
  }
  if (shiny) {
    chain.push(`${BASE}/shiny/${id}.png`)
    chain.push(`${BASE}/${id}.png`)
  } else if (style === 'home') {
    chain.push(`${BASE}/${id}.png`)
  }
  return chain
}

/** @deprecated use spriteFallbackChain */
export function spriteFallbackUrl(
  id: number,
  style: SpriteStyle,
  shiny = false,
): string | null {
  return spriteFallbackChain(id, style, { shiny })[0] ?? null
}

export function spriteImageRendering(
  style: SpriteStyle,
  variant: SpriteVariant = 'default',
): 'pixelated' | 'auto' {
  if (variant === 'mega' || variant === 'gmax') return 'auto'
  return style === 'pixel' ? 'pixelated' : 'auto'
}
