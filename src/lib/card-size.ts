import type { CardSize } from '@/lib/types';

export type { CardSize };

export const CARD_SIZES: CardSize[] = ['small', 'medium', 'large'];

type CardSizeConfig = {
  spriteClass: string;
  listSpriteClass: string;
  spritePx: number;
  gridRowHeight: number;
  listRowHeight: number;
  cardPadClass: string;
};

export const CARD_SIZE_CONFIG: Record<CardSize, CardSizeConfig> = {
  small: {
    spriteClass: 'size-12 sm:size-14',
    listSpriteClass: 'size-12 sm:size-14',
    spritePx: 56,
    gridRowHeight: 168,
    listRowHeight: 88,
    cardPadClass: 'pt-7',
  },
  medium: {
    spriteClass: 'size-16 sm:size-20',
    listSpriteClass: 'size-18 sm:size-20',
    spritePx: 80,
    gridRowHeight: 220,
    listRowHeight: 104,
    cardPadClass: 'pt-8',
  },
  large: {
    spriteClass: 'size-24 sm:size-28',
    listSpriteClass: 'size-22 sm:size-24',
    spritePx: 112,
    gridRowHeight: 292,
    listRowHeight: 128,
    cardPadClass: 'pt-9',
  },
};

/** Coerce unknown / missing prefs to a known card size (defaults to medium). */
export function resolveCardSize(value: unknown): CardSize {
  return typeof value === 'string' && CARD_SIZES.includes(value as CardSize) ? (value as CardSize) : 'medium';
}

export function cardSizeConfig(value: unknown): CardSizeConfig {
  return CARD_SIZE_CONFIG[resolveCardSize(value)];
}

/** How many grid columns fit at a given width for the active card size. */
export function gridColumnCount(width: number, cardSize: CardSize): number {
  const size = resolveCardSize(cardSize);
  if (size === 'small') {
    if (width >= 1024) return 8;
    if (width >= 768) return 6;
    if (width >= 640) return 5;
    return 4;
  }
  if (size === 'large') {
    if (width >= 1024) return 4;
    if (width >= 640) return 3;
    return 2;
  }
  if (width >= 1024) return 6;
  if (width >= 768) return 5;
  if (width >= 640) return 4;
  return 3;
}
