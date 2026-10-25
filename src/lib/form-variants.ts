import formVariants from "@/data/form-variants.json";
import type { DexBox, FormView } from "@/lib/types";

export type FormRegion = "alola" | "galar" | "hisui" | "paldea";

export type FormVariantEntry = {
  formId: number;
  /** Showdown dex slug (e.g. charizard-megax). */
  slug: string;
  /** PokéAPI pokemon name (e.g. charizard-mega-x). */
  apiSlug?: string;
  region?: FormRegion;
  alts?: Array<{ formId: number; slug: string; apiSlug?: string; region?: FormRegion }>;
};

const megaByNational = formVariants.mega as Record<string, FormVariantEntry>;
const gmaxByNational = formVariants.gmax as Record<string, FormVariantEntry>;
const regionalByNational = (formVariants as { regional?: Record<string, FormVariantEntry> })
  .regional as Record<string, FormVariantEntry> | undefined;

export function getMegaVariant(nationalId: number): FormVariantEntry | undefined {
  return megaByNational[String(nationalId)];
}

export function getGmaxVariant(nationalId: number): FormVariantEntry | undefined {
  return gmaxByNational[String(nationalId)];
}

export function getRegionalVariant(nationalId: number): FormVariantEntry | undefined {
  return regionalByNational?.[String(nationalId)];
}

export function getRegionalForRegion(
  nationalId: number,
  region: FormRegion,
): FormVariantEntry | undefined {
  const entry = getRegionalVariant(nationalId);
  if (!entry) return undefined;
  if (entry.region === region) return entry;
  const alt = entry.alts?.find((a) => a.region === region);
  return alt ? { ...alt, alts: undefined } : undefined;
}

export function canMega(nationalId: number): boolean {
  return Boolean(getMegaVariant(nationalId));
}

export function canGmax(nationalId: number): boolean {
  return Boolean(getGmaxVariant(nationalId));
}

export function canRegional(nationalId: number): boolean {
  return Boolean(getRegionalVariant(nationalId));
}

export function megaSpeciesCount(): number {
  return formVariants.megaCount;
}

export function gmaxSpeciesCount(): number {
  return formVariants.gmaxCount;
}

export function regionalSpeciesCount(): number {
  return (formVariants as { regionalCount?: number }).regionalCount ?? 0;
}

/** Narrow boxes to slots that support the active form view (mega/gmax/regional). */
export function filterBoxesForFormView(boxes: DexBox[], formView: FormView): DexBox[] {
  if (formView !== "mega" && formView !== "gmax" && formView !== "regional") return boxes;
  const eligible =
    formView === "mega" ? canMega : formView === "gmax" ? canGmax : canRegional;

  return boxes
    .map((box) => ({
      ...box,
      slots: box.slots.filter((slot) => eligible(slot.id)),
    }))
    .filter((box) => box.slots.length > 0);
}

export function formSpriteSlug(
  nationalId: number,
  variant: "mega" | "gmax" | "regional",
  fallbackSlug?: string,
): string | undefined {
  const entry =
    variant === "mega"
      ? getMegaVariant(nationalId)
      : variant === "gmax"
        ? getGmaxVariant(nationalId)
        : getRegionalVariant(nationalId);
  return entry?.slug ?? (fallbackSlug ? `${fallbackSlug}-${variant}` : undefined);
}

export function formIdsForSprite(
  nationalId: number,
  variant: "mega" | "gmax" | "regional",
): number[] {
  const entry =
    variant === "mega"
      ? getMegaVariant(nationalId)
      : variant === "gmax"
        ? getGmaxVariant(nationalId)
        : getRegionalVariant(nationalId);
  if (!entry) return [];
  return [entry.formId, ...(entry.alts?.map((a) => a.formId) ?? [])];
}
