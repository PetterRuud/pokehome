import { useEffect } from "react";
import { toast } from "sonner";
import { useDexStore } from "@/lib/store";
import { categorizeGifts } from "@/lib/gifts";
import { loadGiftFeed } from "@/server/gifts";

export function GiftNotifier() {
  const hydrated = useDexStore((s) => s.hydrated);
  const notificationsEnabled = useDexStore((s) => s.prefs.notificationsEnabled);
  const lastSeenGiftIds = useDexStore((s) => s.lastSeenGiftIds);
  const markGiftsSeen = useDexStore((s) => s.markGiftsSeen);

  useEffect(() => {
    if (!hydrated || !notificationsEnabled) return;

    let cancelled = false;

    void (async () => {
      try {
        const feed = await loadGiftFeed();
        if (cancelled) return;

        const { active, endingSoon } = categorizeGifts(feed.gifts);
        const live = [...endingSoon, ...active];
        const newOnes = live.filter((g) => !lastSeenGiftIds.includes(g.id));
        if (newOnes.length === 0) return;

        const title =
          newOnes.length === 1
            ? `Mystery gift: ${newOnes[0]!.name}`
            : `${newOnes.length} active mystery gifts`;

        const body =
          newOnes.length === 1
            ? `${newOnes[0]!.games.join(", ")} · ${newOnes[0]!.method}`
            : newOnes.map((g) => g.name).join(", ");

        toast(title, { description: body });

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(title, { body, tag: "pokehome-gifts" });
          } catch {
            // ignore
          }
        }

        markGiftsSeen(newOnes.map((g) => g.id));
      } catch {
        // Feed unavailable — skip quietly
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, notificationsEnabled, lastSeenGiftIds, markGiftsSeen]);

  return null;
}
