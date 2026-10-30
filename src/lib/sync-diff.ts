import type { ExportPayload, GameId } from '@/lib/types';

export type FlagMapName =
  | 'homeByKey'
  | 'caughtByKey'
  | 'shinyByKey'
  | 'alphaByKey'
  | 'megaByKey'
  | 'gmaxByKey'
  | 'regionalByKey';

export type MapDiff = {
  label: string;
  localCount: number;
  cloudCount: number;
  onlyLocal: number;
  onlyCloud: number;
  both: number;
  examplesOnlyLocal: string[];
  examplesOnlyCloud: string[];
};

export type SyncDiffSummary = {
  maps: MapDiff[];
  claimedGifts: {
    localCount: number;
    cloudCount: number;
    onlyLocal: number;
    onlyCloud: number;
  };
  gameCaughtOnlyLocal: number;
  gameCaughtOnlyCloud: number;
  gameHomeOnlyLocal: number;
  gameHomeOnlyCloud: number;
};

const FLAG_MAPS: Array<{ key: FlagMapName; label: string }> = [
  { key: 'homeByKey', label: 'HOME' },
  { key: 'caughtByKey', label: 'Caught' },
  { key: 'shinyByKey', label: 'Shiny' },
  { key: 'alphaByKey', label: 'Alpha' },
  { key: 'megaByKey', label: 'Mega' },
  { key: 'gmaxByKey', label: 'Gmax' },
  { key: 'regionalByKey', label: 'Regional' },
];

function trueKeys(map: Record<string, boolean> | undefined): Set<string> {
  const out = new Set<string>();
  if (!map) return out;
  for (const [key, value] of Object.entries(map)) {
    if (value) out.add(key);
  }
  return out;
}

function countTrue(map: Record<string, boolean> | undefined): number {
  return trueKeys(map).size;
}

function diffFlagMaps(
  local: Record<string, boolean> | undefined,
  cloud: Record<string, boolean> | undefined,
  label: string,
  exampleLimit = 3,
): MapDiff {
  const localKeys = trueKeys(local);
  const cloudKeys = trueKeys(cloud);
  let onlyLocal = 0;
  let onlyCloud = 0;
  let both = 0;
  const examplesOnlyLocal: string[] = [];
  const examplesOnlyCloud: string[] = [];

  for (const key of localKeys) {
    if (cloudKeys.has(key)) {
      both += 1;
    } else {
      onlyLocal += 1;
      if (examplesOnlyLocal.length < exampleLimit) examplesOnlyLocal.push(key);
    }
  }
  for (const key of cloudKeys) {
    if (!localKeys.has(key)) {
      onlyCloud += 1;
      if (examplesOnlyCloud.length < exampleLimit) examplesOnlyCloud.push(key);
    }
  }

  return {
    label,
    localCount: localKeys.size,
    cloudCount: cloudKeys.size,
    onlyLocal,
    onlyCloud,
    both,
    examplesOnlyLocal,
    examplesOnlyCloud,
  };
}

function flattenGameMap(map: Record<GameId, Record<string, boolean>> | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!map) return out;
  for (const [gameId, flags] of Object.entries(map)) {
    for (const [key, value] of Object.entries(flags ?? {})) {
      if (value) out[`${gameId}:${key}`] = true;
    }
  }
  return out;
}

function countTrueInGameMap(map: Record<GameId, Record<string, boolean>> | undefined): number {
  return countTrue(flattenGameMap(map));
}

/** True when this browser has any marked progress worth protecting. */
export function hasMeaningfulLocalProgress(payload: ExportPayload): boolean {
  for (const { key } of FLAG_MAPS) {
    if (countTrue(payload[key]) > 0) return true;
  }
  if (payload.claimedGiftIds.length > 0) return true;
  if (countTrueInGameMap(payload.caughtByGame) > 0) return true;
  if (countTrueInGameMap(payload.homeByGame) > 0) return true;
  return false;
}

export function diffExportPayloads(local: ExportPayload, cloud: ExportPayload): SyncDiffSummary {
  const maps = FLAG_MAPS.map(({ key, label }) => diffFlagMaps(local[key], cloud[key], label));

  const localGifts = new Set(local.claimedGiftIds);
  const cloudGifts = new Set(cloud.claimedGiftIds);
  let giftsOnlyLocal = 0;
  let giftsOnlyCloud = 0;
  for (const id of localGifts) {
    if (!cloudGifts.has(id)) giftsOnlyLocal += 1;
  }
  for (const id of cloudGifts) {
    if (!localGifts.has(id)) giftsOnlyCloud += 1;
  }

  const localCaughtGames = flattenGameMap(local.caughtByGame);
  const cloudCaughtGames = flattenGameMap(cloud.caughtByGame);
  const caughtGameDiff = diffFlagMaps(localCaughtGames, cloudCaughtGames, 'Game caught');

  const localHomeGames = flattenGameMap(local.homeByGame);
  const cloudHomeGames = flattenGameMap(cloud.homeByGame);
  const homeGameDiff = diffFlagMaps(localHomeGames, cloudHomeGames, 'Game HOME');

  return {
    maps,
    claimedGifts: {
      localCount: localGifts.size,
      cloudCount: cloudGifts.size,
      onlyLocal: giftsOnlyLocal,
      onlyCloud: giftsOnlyCloud,
    },
    gameCaughtOnlyLocal: caughtGameDiff.onlyLocal,
    gameCaughtOnlyCloud: caughtGameDiff.onlyCloud,
    gameHomeOnlyLocal: homeGameDiff.onlyLocal,
    gameHomeOnlyCloud: homeGameDiff.onlyCloud,
  };
}
