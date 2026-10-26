import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { AnyExportPayload, BoxLayout, DexPrefs, ExportPayload, FormView, GameId, SpriteStyle } from '@/lib/types';
import { EMPTY_BOX_LAYOUT } from '@/lib/box-layout';
import { migrateCaughtByGame } from '@/lib/caught-by-game';

type DexState = {
  caughtByKey: Record<string, boolean>;
  homeByKey: Record<string, boolean>;
  shinyByKey: Record<string, boolean>;
  alphaByKey: Record<string, boolean>;
  megaByKey: Record<string, boolean>;
  gmaxByKey: Record<string, boolean>;
  regionalByKey: Record<string, boolean>;
  caughtByGame: Record<GameId, Record<string, boolean>>;
  claimedGiftIds: string[];
  lastSeenGiftIds: string[];
  prefs: DexPrefs;
  nationalBoxLayout: BoxLayout;
  /** ISO timestamp of last local data change (for cloud LWW sync). */
  localUpdatedAt: string;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  toggleCaught: (key: string) => void;
  setCaught: (key: string, caught: boolean) => void;
  setCaughtMany: (keys: string[], caught: boolean) => void;
  toggleHome: (key: string) => void;
  setHome: (key: string, home: boolean) => void;
  setHomeMany: (keys: string[], home: boolean) => void;
  toggleShiny: (key: string) => void;
  setShiny: (key: string, shiny: boolean) => void;
  setShinyMany: (keys: string[], shiny: boolean) => void;
  toggleAlpha: (key: string) => void;
  setAlpha: (key: string, alpha: boolean) => void;
  setAlphaMany: (keys: string[], alpha: boolean) => void;
  toggleMega: (key: string) => void;
  setMega: (key: string, mega: boolean) => void;
  setMegaMany: (keys: string[], mega: boolean) => void;
  toggleGmax: (key: string) => void;
  setGmax: (key: string, gmax: boolean) => void;
  setGmaxMany: (keys: string[], gmax: boolean) => void;
  toggleRegional: (key: string) => void;
  setRegional: (key: string, regional: boolean) => void;
  setRegionalMany: (keys: string[], regional: boolean) => void;
  toggleGameCaught: (gameId: GameId, key: string) => void;
  setGameCaught: (gameId: GameId, key: string, caught: boolean) => void;
  setGameCaughtMany: (gameId: GameId, keys: string[], caught: boolean) => void;
  setGamesCaughtMany: (gameIds: GameId[], keys: string[], caught: boolean) => void;
  toggleClaimedGift: (id: string) => void;
  markGiftsSeen: (ids: string[]) => void;
  setPref: <K extends keyof DexPrefs>(key: K, value: DexPrefs[K]) => void;
  setNationalBoxLayout: (layout: BoxLayout) => void;
  renameNationalBox: (boxId: string, title: string, defaultTitle: string) => void;
  exportData: () => ExportPayload;
  importData: (payload: AnyExportPayload, mode: 'merge' | 'replace') => void;
  resetAll: () => void;
};

function normalizeBoxLayout(layout?: Partial<BoxLayout> | null): BoxLayout {
  return {
    // Custom box order removed — keep empty for backup compatibility.
    order: [],
    titles: layout?.titles && typeof layout.titles === 'object' ? { ...layout.titles } : {},
  };
}

const FORM_VIEWS: FormView[] = ['default', 'home', 'shiny', 'alpha', 'mega', 'gmax', 'regional'];
const SPRITE_STYLES: SpriteStyle[] = ['pixel', 'home'];

const defaultPrefs: DexPrefs = {
  notificationsEnabled: false,
  formView: 'home',
  spriteStyle: 'pixel',
};

type LegacyPrefs = Partial<DexPrefs> & {
  showShiny?: boolean;
  showAlpha?: boolean;
  showMega?: boolean;
  showGmax?: boolean;
};

function migrateFormView(prefs?: LegacyPrefs | null): FormView {
  if (prefs?.formView && FORM_VIEWS.includes(prefs.formView)) {
    return prefs.formView;
  }
  // Legacy multi-toggle prefs → single view. Old default had several on → All.
  const active = (
    [
      prefs?.showShiny ? 'shiny' : null,
      prefs?.showAlpha ? 'alpha' : null,
      prefs?.showMega ? 'mega' : null,
      prefs?.showGmax ? 'gmax' : null,
    ] as const
  ).filter((v): v is 'shiny' | 'alpha' | 'mega' | 'gmax' => v != null);
  if (active.length === 1) return active[0];
  return 'home';
}

function normalizePrefs(prefs?: LegacyPrefs | null): DexPrefs {
  return {
    notificationsEnabled: prefs?.notificationsEnabled ?? false,
    formView: migrateFormView(prefs),
    spriteStyle: prefs?.spriteStyle && SPRITE_STYLES.includes(prefs.spriteStyle) ? prefs.spriteStyle : 'pixel',
  };
}

const idbStorage = createJSONStorage(() => ({
  getItem: async (name) => {
    const value = await get<string>(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
}));

function migrateV1Status(statusByKey: Record<string, string> | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!statusByKey) return out;
  for (const [key, status] of Object.entries(statusByKey)) {
    if (status === 'caught' || status === 'lv100') out[key] = true;
  }
  return out;
}

function normalizeImport(payload: AnyExportPayload): Omit<ExportPayload, 'version' | 'exportedAt'> {
  if (payload.version === 5) {
    return {
      caughtByKey: payload.caughtByKey ?? {},
      homeByKey: payload.homeByKey ?? {},
      shinyByKey: payload.shinyByKey ?? {},
      alphaByKey: payload.alphaByKey ?? {},
      megaByKey: payload.megaByKey ?? {},
      gmaxByKey: payload.gmaxByKey ?? {},
      regionalByKey: payload.regionalByKey ?? {},
      caughtByGame: migrateCaughtByGame(payload.caughtByGame),
      claimedGiftIds: payload.claimedGiftIds ?? [],
      lastSeenGiftIds: payload.lastSeenGiftIds ?? [],
      prefs: normalizePrefs(payload.prefs),
      nationalBoxLayout: normalizeBoxLayout(payload.nationalBoxLayout),
    };
  }

  if (payload.version === 4) {
    return {
      caughtByKey: payload.caughtByKey ?? {},
      homeByKey: {},
      shinyByKey: payload.shinyByKey ?? {},
      alphaByKey: payload.alphaByKey ?? {},
      megaByKey: payload.megaByKey ?? {},
      gmaxByKey: payload.gmaxByKey ?? {},
      regionalByKey: {},
      caughtByGame: migrateCaughtByGame(payload.caughtByGame),
      claimedGiftIds: payload.claimedGiftIds ?? [],
      lastSeenGiftIds: payload.lastSeenGiftIds ?? [],
      prefs: normalizePrefs(payload.prefs),
      nationalBoxLayout: EMPTY_BOX_LAYOUT,
    };
  }

  if (payload.version === 3) {
    return {
      caughtByKey: payload.caughtByKey ?? {},
      homeByKey: {},
      shinyByKey: payload.shinyByKey ?? {},
      alphaByKey: payload.alphaByKey ?? {},
      megaByKey: payload.megaByKey ?? {},
      gmaxByKey: {},
      regionalByKey: {},
      caughtByGame: migrateCaughtByGame(payload.caughtByGame),
      claimedGiftIds: payload.claimedGiftIds ?? [],
      lastSeenGiftIds: payload.lastSeenGiftIds ?? [],
      prefs: normalizePrefs(payload.prefs),
      nationalBoxLayout: EMPTY_BOX_LAYOUT,
    };
  }

  if (payload.version === 2) {
    return {
      caughtByKey: payload.caughtByKey ?? {},
      homeByKey: {},
      shinyByKey: payload.shinyByKey ?? {},
      alphaByKey: {},
      megaByKey: {},
      gmaxByKey: {},
      regionalByKey: {},
      caughtByGame: {},
      claimedGiftIds: payload.claimedGiftIds ?? [],
      lastSeenGiftIds: payload.lastSeenGiftIds ?? [],
      prefs: normalizePrefs(payload.prefs),
      nationalBoxLayout: EMPTY_BOX_LAYOUT,
    };
  }

  return {
    caughtByKey: migrateV1Status(payload.statusByKey),
    homeByKey: {},
    shinyByKey: {},
    alphaByKey: {},
    megaByKey: {},
    gmaxByKey: {},
    regionalByKey: {},
    caughtByGame: {},
    claimedGiftIds: payload.claimedGiftIds ?? [],
    lastSeenGiftIds: payload.lastSeenGiftIds ?? [],
    prefs: normalizePrefs(payload.prefs),
    nationalBoxLayout: EMPTY_BOX_LAYOUT,
  };
}

function mergeGameCaught(a: Record<GameId, Record<string, boolean>>, b: Record<GameId, Record<string, boolean>>) {
  const out: Record<GameId, Record<string, boolean>> = { ...a };
  for (const [gameId, map] of Object.entries(b)) {
    out[gameId] = { ...out[gameId], ...map };
  }
  return out;
}

export const useDexStore = create<DexState>()(
  persist(
    (set, get) => ({
      caughtByKey: {},
      homeByKey: {},
      shinyByKey: {},
      alphaByKey: {},
      megaByKey: {},
      gmaxByKey: {},
      regionalByKey: {},
      caughtByGame: {},
      claimedGiftIds: [],
      lastSeenGiftIds: [],
      prefs: defaultPrefs,
      nationalBoxLayout: EMPTY_BOX_LAYOUT,
      localUpdatedAt: new Date(0).toISOString(),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      toggleCaught: (key) =>
        set((s) => ({
          caughtByKey: {
            ...s.caughtByKey,
            [key]: !s.caughtByKey[key],
          },
        })),
      setCaught: (key, caught) =>
        set((s) => ({
          caughtByKey: { ...s.caughtByKey, [key]: caught },
        })),
      setCaughtMany: (keys, caught) =>
        set((s) => {
          const next = { ...s.caughtByKey };
          for (const key of keys) next[key] = caught;
          return { caughtByKey: next };
        }),
      toggleHome: (key) =>
        set((s) => ({
          homeByKey: {
            ...s.homeByKey,
            [key]: !s.homeByKey[key],
          },
        })),
      setHome: (key, home) =>
        set((s) => ({
          homeByKey: { ...s.homeByKey, [key]: home },
        })),
      setHomeMany: (keys, home) =>
        set((s) => {
          const next = { ...s.homeByKey };
          for (const key of keys) next[key] = home;
          return { homeByKey: next };
        }),
      toggleShiny: (key) =>
        set((s) => ({
          shinyByKey: {
            ...s.shinyByKey,
            [key]: !s.shinyByKey[key],
          },
        })),
      setShiny: (key, shiny) =>
        set((s) => ({
          shinyByKey: { ...s.shinyByKey, [key]: shiny },
        })),
      setShinyMany: (keys, shiny) =>
        set((s) => {
          const next = { ...s.shinyByKey };
          for (const key of keys) next[key] = shiny;
          return { shinyByKey: next };
        }),
      toggleAlpha: (key) =>
        set((s) => ({
          alphaByKey: {
            ...s.alphaByKey,
            [key]: !s.alphaByKey[key],
          },
        })),
      setAlpha: (key, alpha) =>
        set((s) => ({
          alphaByKey: { ...s.alphaByKey, [key]: alpha },
        })),
      setAlphaMany: (keys, alpha) =>
        set((s) => {
          const next = { ...s.alphaByKey };
          for (const key of keys) next[key] = alpha;
          return { alphaByKey: next };
        }),
      toggleMega: (key) =>
        set((s) => ({
          megaByKey: {
            ...s.megaByKey,
            [key]: !s.megaByKey[key],
          },
        })),
      setMega: (key, mega) =>
        set((s) => ({
          megaByKey: { ...s.megaByKey, [key]: mega },
        })),
      setMegaMany: (keys, mega) =>
        set((s) => {
          const next = { ...s.megaByKey };
          for (const key of keys) next[key] = mega;
          return { megaByKey: next };
        }),
      toggleGmax: (key) =>
        set((s) => ({
          gmaxByKey: {
            ...s.gmaxByKey,
            [key]: !s.gmaxByKey[key],
          },
        })),
      setGmax: (key, gmax) =>
        set((s) => ({
          gmaxByKey: { ...s.gmaxByKey, [key]: gmax },
        })),
      setGmaxMany: (keys, gmax) =>
        set((s) => {
          const next = { ...s.gmaxByKey };
          for (const key of keys) next[key] = gmax;
          return { gmaxByKey: next };
        }),
      toggleRegional: (key) =>
        set((s) => ({
          regionalByKey: {
            ...s.regionalByKey,
            [key]: !s.regionalByKey[key],
          },
        })),
      setRegional: (key, regional) =>
        set((s) => ({
          regionalByKey: { ...s.regionalByKey, [key]: regional },
        })),
      setRegionalMany: (keys, regional) =>
        set((s) => {
          const next = { ...s.regionalByKey };
          for (const key of keys) next[key] = regional;
          return { regionalByKey: next };
        }),
      toggleGameCaught: (gameId, key) =>
        set((s) => {
          const game = s.caughtByGame[gameId] ?? {};
          return {
            caughtByGame: {
              ...s.caughtByGame,
              [gameId]: { ...game, [key]: !game[key] },
            },
          };
        }),
      setGameCaught: (gameId, key, caught) =>
        set((s) => ({
          caughtByGame: {
            ...s.caughtByGame,
            [gameId]: { ...s.caughtByGame[gameId], [key]: caught },
          },
        })),
      setGameCaughtMany: (gameId, keys, caught) =>
        set((s) => {
          const game = { ...s.caughtByGame[gameId] };
          for (const key of keys) game[key] = caught;
          return {
            caughtByGame: { ...s.caughtByGame, [gameId]: game },
          };
        }),
      setGamesCaughtMany: (gameIds, keys, caught) =>
        set((s) => {
          const caughtByGame = { ...s.caughtByGame };
          for (const gameId of gameIds) {
            const game = { ...caughtByGame[gameId] };
            for (const key of keys) game[key] = caught;
            caughtByGame[gameId] = game;
          }
          return { caughtByGame };
        }),
      toggleClaimedGift: (id) =>
        set((s) => {
          const has = s.claimedGiftIds.includes(id);
          return {
            claimedGiftIds: has ? s.claimedGiftIds.filter((x) => x !== id) : [...s.claimedGiftIds, id],
          };
        }),
      markGiftsSeen: (ids) =>
        set((s) => ({
          lastSeenGiftIds: Array.from(new Set([...s.lastSeenGiftIds, ...ids])),
        })),
      setPref: (key, value) => set((s) => ({ prefs: { ...s.prefs, [key]: value } })),
      setNationalBoxLayout: (layout) => set({ nationalBoxLayout: normalizeBoxLayout(layout) }),
      renameNationalBox: (boxId, title, defaultTitle) =>
        set((s) => {
          const trimmed = title.trim();
          const titles = { ...s.nationalBoxLayout.titles };
          if (!trimmed || trimmed === defaultTitle) delete titles[boxId];
          else titles[boxId] = trimmed;
          return {
            nationalBoxLayout: { ...s.nationalBoxLayout, titles, order: [] },
          };
        }),
      exportData: () => {
        const s = get();
        const exportedAt = s.localUpdatedAt || new Date().toISOString();
        return {
          version: 5 as const,
          exportedAt,
          caughtByKey: s.caughtByKey,
          homeByKey: s.homeByKey,
          shinyByKey: s.shinyByKey,
          alphaByKey: s.alphaByKey,
          megaByKey: s.megaByKey,
          gmaxByKey: s.gmaxByKey,
          regionalByKey: s.regionalByKey,
          caughtByGame: s.caughtByGame,
          claimedGiftIds: s.claimedGiftIds,
          lastSeenGiftIds: s.lastSeenGiftIds,
          prefs: s.prefs,
          nationalBoxLayout: s.nationalBoxLayout,
        };
      },
      importData: (payload, mode) => {
        if (
          payload.version !== 1 &&
          payload.version !== 2 &&
          payload.version !== 3 &&
          payload.version !== 4 &&
          payload.version !== 5
        ) {
          return;
        }
        const next = normalizeImport(payload);
        const cloudTime =
          'exportedAt' in payload && typeof payload.exportedAt === 'string'
            ? payload.exportedAt
            : new Date().toISOString();
        set((s) => {
          if (mode === 'replace') {
            return { ...next, localUpdatedAt: cloudTime };
          }
          return {
            caughtByKey: { ...s.caughtByKey, ...next.caughtByKey },
            homeByKey: { ...s.homeByKey, ...next.homeByKey },
            shinyByKey: { ...s.shinyByKey, ...next.shinyByKey },
            alphaByKey: { ...s.alphaByKey, ...next.alphaByKey },
            megaByKey: { ...s.megaByKey, ...next.megaByKey },
            gmaxByKey: { ...s.gmaxByKey, ...next.gmaxByKey },
            regionalByKey: { ...s.regionalByKey, ...next.regionalByKey },
            caughtByGame: mergeGameCaught(s.caughtByGame, next.caughtByGame),
            claimedGiftIds: Array.from(new Set([...s.claimedGiftIds, ...next.claimedGiftIds])),
            lastSeenGiftIds: Array.from(new Set([...s.lastSeenGiftIds, ...next.lastSeenGiftIds])),
            prefs: normalizePrefs({ ...s.prefs, ...next.prefs }),
            nationalBoxLayout:
              Object.keys(next.nationalBoxLayout.titles).length > 0 ? next.nationalBoxLayout : s.nationalBoxLayout,
            localUpdatedAt: new Date().toISOString(),
          };
        });
      },
      resetAll: () =>
        set({
          caughtByKey: {},
          homeByKey: {},
          shinyByKey: {},
          alphaByKey: {},
          megaByKey: {},
          gmaxByKey: {},
          regionalByKey: {},
          caughtByGame: {},
          claimedGiftIds: [],
          lastSeenGiftIds: [],
          prefs: defaultPrefs,
          nationalBoxLayout: EMPTY_BOX_LAYOUT,
          localUpdatedAt: new Date().toISOString(),
        }),
    }),
    {
      name: 'pokehome-dex',
      storage: idbStorage,
      version: 10,
      migrate: (persisted: unknown, fromVersion) => {
        const state = persisted as Partial<DexState> & {
          statusByKey?: Record<string, string>;
          prefs?: LegacyPrefs;
        };
        let next = { ...state };

        if (state?.statusByKey && !state.caughtByKey) {
          next = {
            ...next,
            caughtByKey: migrateV1Status(state.statusByKey),
            shinyByKey: state.shinyByKey ?? {},
          };
        }

        if (fromVersion < 3) {
          next = {
            ...next,
            alphaByKey: state.alphaByKey ?? {},
            megaByKey: state.megaByKey ?? {},
            caughtByGame: state.caughtByGame ?? {},
          };
        }

        if (fromVersion < 5) {
          next = {
            ...next,
            gmaxByKey: state.gmaxByKey ?? {},
          };
        }

        if (fromVersion < 6) {
          next = {
            ...next,
            nationalBoxLayout: normalizeBoxLayout(state.nationalBoxLayout),
          };
        }

        if (fromVersion < 7) {
          next = {
            ...next,
            localUpdatedAt: state.localUpdatedAt ?? new Date(0).toISOString(),
          };
        }

        if (fromVersion < 8) {
          next = {
            ...next,
            regionalByKey: state.regionalByKey ?? {},
          };
        }

        if (fromVersion < 9) {
          next = {
            ...next,
            homeByKey: state.homeByKey ?? {},
          };
        }

        // v10: national filter default is HOME (was Caught / `default`)
        if (fromVersion < 10) {
          const prefs = next.prefs ?? state.prefs;
          if (!prefs?.formView || prefs.formView === 'default') {
            next = {
              ...next,
              prefs: { ...normalizePrefs(prefs), formView: 'home' },
            };
          }
        }

        // v4: split merged game ids; v5: formView + gmax; v6: box layout; v7: localUpdatedAt; v8: regional; v9: home; v10: HOME default
        return {
          ...next,
          caughtByGame: migrateCaughtByGame(next.caughtByGame),
          prefs: normalizePrefs(next.prefs),
          nationalBoxLayout: normalizeBoxLayout(next.nationalBoxLayout),
          localUpdatedAt: next.localUpdatedAt ?? new Date(0).toISOString(),
        } as DexState;
      },
      partialize: (s) => ({
        caughtByKey: s.caughtByKey,
        homeByKey: s.homeByKey,
        shinyByKey: s.shinyByKey,
        alphaByKey: s.alphaByKey,
        megaByKey: s.megaByKey,
        gmaxByKey: s.gmaxByKey,
        regionalByKey: s.regionalByKey,
        caughtByGame: s.caughtByGame,
        claimedGiftIds: s.claimedGiftIds,
        lastSeenGiftIds: s.lastSeenGiftIds,
        prefs: s.prefs,
        nationalBoxLayout: s.nationalBoxLayout,
        localUpdatedAt: s.localUpdatedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

const DATA_KEYS = [
  'caughtByKey',
  'homeByKey',
  'shinyByKey',
  'alphaByKey',
  'megaByKey',
  'gmaxByKey',
  'regionalByKey',
  'caughtByGame',
  'claimedGiftIds',
  'lastSeenGiftIds',
  'prefs',
  'nationalBoxLayout',
] as const;

/** Bump localUpdatedAt whenever dex data changes (skips cloud apply which sets it explicitly). */
useDexStore.subscribe((state, prev) => {
  if (!state.hydrated || !prev.hydrated) return;
  if (state.localUpdatedAt !== prev.localUpdatedAt) return;
  if (DATA_KEYS.some((k) => state[k] !== prev[k])) {
    useDexStore.setState({ localUpdatedAt: new Date().toISOString() });
  }
});

export function isCaught(caught: boolean | undefined): boolean {
  return Boolean(caught);
}
