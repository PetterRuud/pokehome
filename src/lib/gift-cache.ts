import type { MysteryGift } from "@/lib/types";
import { fetchSerebiiGiftFeed, healGift } from "@/lib/serebii-feed";
import fallbackGifts from "@/data/mystery-gifts.json";

export const GIFT_CACHE_KEY = "https://pokehome.internal/mystery-gifts-v2";
export const GIFT_CACHE_META_KEY = "https://pokehome.internal/mystery-gifts-meta-v2";

export type GiftFeedPayload = {
  gifts: MysteryGift[];
  source: "serebii" | "fallback";
  fetchedAt: string;
  error?: string;
};

const memory = new Map<string, { expires: number; value: string }>();

function memoryGet(key: string) {
  const hit = memory.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

function memorySet(key: string, value: string, ttlMs: number) {
  memory.set(key, { value, expires: Date.now() + ttlMs });
}

async function cacheGet(key: string): Promise<string | null> {
  const local = memoryGet(key);
  if (local) return local;
  try {
    const cache = await caches.open("pokehome-gifts");
    const hit = await cache.match(key);
    if (!hit) return null;
    const text = await hit.text();
    memorySet(key, text, 1000 * 60 * 60);
    return text;
  } catch {
    return null;
  }
}

async function cachePut(key: string, value: string, maxAgeSeconds: number) {
  memorySet(key, value, maxAgeSeconds * 1000);
  try {
    const cache = await caches.open("pokehome-gifts");
    await cache.put(
      key,
      new Response(value, {
        headers: {
          "content-type": "application/json",
          "cache-control": `public, max-age=${maxAgeSeconds}`,
        },
      }),
    );
  } catch {
    // Cache API unavailable (some local contexts)
  }
}

export async function readCachedGiftFeed(): Promise<GiftFeedPayload | null> {
  const raw = await cacheGet(GIFT_CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GiftFeedPayload;
  } catch {
    return null;
  }
}

export async function refreshGiftFeed(): Promise<GiftFeedPayload> {
  try {
    const gifts = await fetchSerebiiGiftFeed();
    if (gifts.length === 0) {
      throw new Error("Serebii feed returned 0 events");
    }
    const payload: GiftFeedPayload = {
      gifts,
      source: "serebii",
      fetchedAt: new Date().toISOString(),
    };
    await cachePut(GIFT_CACHE_KEY, JSON.stringify(payload), 60 * 60 * 36);
    await cachePut(
      GIFT_CACHE_META_KEY,
      JSON.stringify({ fetchedAt: payload.fetchedAt, count: gifts.length }),
      60 * 60 * 36,
    );
    return healFeed(payload);
  } catch (err) {
    const cached = await readCachedGiftFeed();
    if (cached?.gifts.length) {
      return healFeed({
        ...cached,
        error: err instanceof Error ? err.message : "Refresh failed",
      });
    }
    const payload: GiftFeedPayload = {
      gifts: fallbackGifts as MysteryGift[],
      source: "fallback",
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Refresh failed",
    };
    await cachePut(GIFT_CACHE_KEY, JSON.stringify(payload), 60 * 60 * 6);
    return healFeed(payload);
  }
}

function healFeed(payload: GiftFeedPayload): GiftFeedPayload {
  return {
    ...payload,
    gifts: payload.gifts.map(healGift),
  };
}

export async function getGiftFeed(): Promise<GiftFeedPayload> {
  const cached = await readCachedGiftFeed();
  if (cached?.gifts.length) return healFeed(cached);
  return healFeed(await refreshGiftFeed());
}
