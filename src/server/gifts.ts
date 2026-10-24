import { createServerFn } from "@tanstack/react-start";
import { getGiftFeed, refreshGiftFeed } from "@/lib/gift-cache";

export const loadGiftFeed = createServerFn({ method: "GET" }).handler(async () => getGiftFeed());

export const syncGiftFeed = createServerFn({ method: "POST" }).handler(async () =>
  refreshGiftFeed(),
);
