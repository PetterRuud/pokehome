import { getGameGroups } from '@/lib/games';
import { trainerTipsById, type GameTips } from '@/data/trainer-tips';

export type TipFamily = {
  id: string;
  name: string;
  short: string;
  logo: string;
  hasTips: boolean;
};

/** Stable family slug from groupShort (`Z-A` → `za`, `SwSh` → `swsh`). */
export function tipFamilyId(groupShort: string): string {
  return groupShort.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export function getTipFamilies(): TipFamily[] {
  return getGameGroups().map((group) => {
    const id = tipFamilyId(group.short);
    return {
      id,
      name: group.name,
      short: group.short,
      logo: group.logo,
      hasTips: Boolean(trainerTipsById[id]?.sections.length),
    };
  });
}

export function getTips(id: string): GameTips | undefined {
  return trainerTipsById[id];
}

export function getDefaultTipFamilyId(): string {
  const families = getTipFamilies();
  return families.find((f) => f.hasTips)?.id ?? families[0]?.id ?? 'za';
}
