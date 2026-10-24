import type { GameId } from "@/lib/types";

/** Legacy merged game ids → first/main split id. */
export const LEGACY_GAME_ID_MAP: Record<string, GameId> = {
  swsh: "swsh-galar",
  sv: "sv-paldea",
  za: "za-lumiose",
};

export function migrateCaughtByGame(
  caughtByGame: Record<string, Record<string, boolean>> | undefined,
): Record<GameId, Record<string, boolean>> {
  if (!caughtByGame) return {};
  const out: Record<GameId, Record<string, boolean>> = {};
  for (const [id, map] of Object.entries(caughtByGame)) {
    const nextId = LEGACY_GAME_ID_MAP[id] ?? id;
    out[nextId] = { ...(out[nextId] ?? {}), ...map };
  }
  return out;
}
