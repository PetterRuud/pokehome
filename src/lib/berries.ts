import type { TipBerry } from "@/data/trainer-tips";

const BERRY_SPRITE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export function berrySpriteUrl(id: string): string {
  return `${BERRY_SPRITE}/${id}-berry.png`;
}

export function berryDisplayName(berry: TipBerry): string {
  const base = berry.id.charAt(0).toUpperCase() + berry.id.slice(1);
  const name = berry.hyper ? `Hyper ${base}` : base;
  return berry.optional ? `${name} (optional)` : name;
}
