import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

type HyperBerryState = {
  counts: Record<string, number>;
  setCount: (id: string, count: number) => void;
  setCounts: (counts: Record<string, number>) => void;
  clearAll: () => void;
};

/** Debounce IDB writes so rapid +/- clicks don't serialize every keystroke. */
let persistTimer: ReturnType<typeof setTimeout> | undefined;
let pendingPersist: { name: string; value: string } | null = null;

const idbStorage = createJSONStorage(() => ({
  getItem: async (name) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: (name, value) => {
    pendingPersist = { name, value };
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      const next = pendingPersist;
      pendingPersist = null;
      if (next) void set(next.name, next.value);
    }, 250);
    return Promise.resolve();
  },
  removeItem: async (name) => {
    clearTimeout(persistTimer);
    pendingPersist = null;
    await del(name);
  },
}));

export const useHyperBerryStore = create<HyperBerryState>()(
  persist(
    (set) => ({
      counts: {},
      setCount: (id, count) =>
        set((s) => {
          const next = { ...s.counts };
          const n = Math.max(0, Math.floor(Number(count)) || 0);
          if (n === 0) delete next[id];
          else next[id] = n;
          return { counts: next };
        }),
      setCounts: (counts) => {
        const next: Record<string, number> = {};
        for (const [id, count] of Object.entries(counts)) {
          const n = Math.max(0, Math.floor(Number(count)) || 0);
          if (n > 0) next[id] = n;
        }
        set({ counts: next });
      },
      clearAll: () => set({ counts: {} }),
    }),
    {
      name: 'pokehome-hyper-berries',
      storage: idbStorage,
      partialize: (s) => ({ counts: s.counts }),
    },
  ),
);
