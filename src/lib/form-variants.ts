import formVariants from '@/data/form-variants.json'
import type { DexBox, FormView } from '@/lib/types'

export type FormVariantEntry = {
  formId: number
  /** Showdown dex slug (e.g. charizard-megax). */
  slug: string
  /** PokéAPI pokemon name (e.g. charizard-mega-x). */
  apiSlug?: string
  alts?: Array<{ formId: number; slug: string; apiSlug?: string }>
}

const megaByNational = formVariants.mega as Record<string, FormVariantEntry>
const gmaxByNational = formVariants.gmax as Record<string, FormVariantEntry>

export function getMegaVariant(nationalId: number): FormVariantEntry | undefined {
  return megaByNational[String(nationalId)]
}

export function getGmaxVariant(nationalId: number): FormVariantEntry | undefined {
  return gmaxByNational[String(nationalId)]
}

export function canMega(nationalId: number): boolean {
  return Boolean(getMegaVariant(nationalId))
}

export function canGmax(nationalId: number): boolean {
  return Boolean(getGmaxVariant(nationalId))
}

export function megaSpeciesCount(): number {
  return formVariants.megaCount
}

export function gmaxSpeciesCount(): number {
  return formVariants.gmaxCount
}

/** Narrow boxes to slots that support the active form view (mega/gmax only). */
export function filterBoxesForFormView(
  boxes: DexBox[],
  formView: FormView,
): DexBox[] {
  if (formView !== 'mega' && formView !== 'gmax') return boxes
  const eligible =
    formView === 'mega' ? canMega : canGmax

  return boxes
    .map((box) => ({
      ...box,
      slots: box.slots.filter((slot) => eligible(slot.id)),
    }))
    .filter((box) => box.slots.length > 0)
}

export function formSpriteSlug(
  nationalId: number,
  variant: 'mega' | 'gmax',
  fallbackSlug?: string,
): string | undefined {
  const entry =
    variant === 'mega' ? getMegaVariant(nationalId) : getGmaxVariant(nationalId)
  return entry?.slug ?? (fallbackSlug ? `${fallbackSlug}-${variant}` : undefined)
}

export function formIdsForSprite(
  nationalId: number,
  variant: 'mega' | 'gmax',
): number[] {
  const entry =
    variant === 'mega' ? getMegaVariant(nationalId) : getGmaxVariant(nationalId)
  if (!entry) return []
  return [entry.formId, ...(entry.alts?.map((a) => a.formId) ?? [])]
}
