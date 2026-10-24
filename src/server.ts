import handler from "@tanstack/react-start/server-entry";
import { refreshGiftFeed } from "@/lib/gift-cache";

type ScheduledController = { scheduledTime: number; cron: string };
type ScheduledEnv = Record<string, unknown>;
type ScheduledContext = { waitUntil: (promise: Promise<unknown>) => void };

export default {
  fetch: handler.fetch,
  async scheduled(_controller: ScheduledController, _env: ScheduledEnv, ctx: ScheduledContext) {
    ctx.waitUntil(
      refreshGiftFeed()
        .then((payload) => {
          console.log(
            JSON.stringify({
              msg: "mystery-gift feed refreshed",
              source: payload.source,
              count: payload.gifts.length,
              fetchedAt: payload.fetchedAt,
              error: payload.error ?? null,
            }),
          );
        })
        .catch((err) => {
          console.error("mystery-gift feed refresh failed", err);
        }),
    );
  },
};
