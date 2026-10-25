import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

type HyperBerryState = {
  counts: Record<string, number>;
  setCount: (id: string, count: number) => void;
  clearAll: () => void;
};

const idbStorage = createJSONStorage(() => ({
  getItem: async (name) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
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
      clearAll: () => set({ counts: {} }),
    }),
    {
      name: 'pokehome-hyper-berries',
      storage: idbStorage,
      partialize: (s) => ({ counts: s.counts }),
    },
  ),
);
