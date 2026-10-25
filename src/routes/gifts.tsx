import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldContent, FieldTitle } from "@/components/ui/field";
import { PokemonSprite } from "@/components/pokemon-sprite";
import { useDexStore } from "@/lib/store";
import {
  categorizeGifts,
  giftDisplayNotes,
  giftSourceLabel,
  giftWindow,
  resolveGiftPokemon,
} from "@/lib/gifts";
import { loadGiftFeed } from "@/server/gifts";
import type { MysteryGift } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/gifts")({
  loader: () => loadGiftFeed(),
  pendingComponent: GiftsPending,
  component: GiftsPage,
});

function TabCount({ n }: { n: number }) {
  return <Badge variant="secondary">{n}</Badge>;
}

function GiftsPending() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function GiftsPage() {
  const feed = Route.useLoaderData();
  const { active, endingSoon, upcoming } = categorizeGifts(feed.gifts);
  const claimedGiftIds = useDexStore((s) => s.claimedGiftIds);
  const claimed = new Set(claimedGiftIds);
  const liveGifts = [...endingSoon, ...active];
  const unclaimedLive = liveGifts.filter((g) => !claimed.has(g.id)).length;
  const toggleClaimedGift = useDexStore((s) => s.toggleClaimedGift);
  const notificationsEnabled = useDexStore((s) => s.prefs.notificationsEnabled);
  const spriteStyle = useDexStore((s) => s.prefs.spriteStyle);
  const setPref = useDexStore((s) => s.setPref);

  async function enableNotifications(checked: boolean) {
    if (!checked) {
      setPref("notificationsEnabled", false);
      return;
    }
    if (typeof Notification === "undefined") {
      toast.error("Notifications are not supported in this browser");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied");
      setPref("notificationsEnabled", false);
      return;
    }
    setPref("notificationsEnabled", true);
    toast.success("Gift alerts enabled");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mystery gifts</h1>
          <p className="text-sm text-muted-foreground">
            Live feed from Serebii · refreshed daily
            {feed.source === "fallback" ? " · offline fallback" : null}
            {liveGifts.length > 0
              ? unclaimedLive > 0
                ? ` · ${unclaimedLive} unclaimed`
                : " · all claimed"
              : null}
          </p>
        </div>
        <Field orientation="horizontal" className="w-auto items-center">
          <FieldContent>
            <FieldTitle>Browser alerts</FieldTitle>
          </FieldContent>
          <Switch checked={notificationsEnabled} onCheckedChange={enableNotifications} />
        </Field>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="active" className="gap-1.5">
            Active
            <TabCount n={active.length} />
          </TabsTrigger>
          <TabsTrigger value="ending" className="gap-1.5">
            Ending soon
            <TabCount n={endingSoon.length} />
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-1.5">
            Upcoming
            <TabCount n={upcoming.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <GiftList
            gifts={active}
            claimedGiftIds={claimedGiftIds}
            spriteStyle={spriteStyle}
            onToggle={toggleClaimedGift}
            empty="No active gifts right now."
          />
        </TabsContent>
        <TabsContent value="ending" className="mt-4">
          <GiftList
            gifts={endingSoon}
            claimedGiftIds={claimedGiftIds}
            spriteStyle={spriteStyle}
            onToggle={toggleClaimedGift}
            empty="Nothing ending in the next 7 days."
          />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <GiftList
            gifts={upcoming}
            claimedGiftIds={claimedGiftIds}
            spriteStyle={spriteStyle}
            onToggle={toggleClaimedGift}
            empty="No upcoming gifts in the feed."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GiftList({
  gifts,
  claimedGiftIds,
  spriteStyle,
  onToggle,
  empty,
}: {
  gifts: MysteryGift[];
  claimedGiftIds: string[];
  spriteStyle: "pixel" | "home";
  onToggle: (id: string) => void;
  empty: string;
}) {
  if (gifts.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing here</EmptyTitle>
          <EmptyDescription>{empty}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {gifts.map((gift) => {
        const w = giftWindow(gift);
        const claimed = claimedGiftIds.includes(gift.id);
        const species = resolveGiftPokemon(gift);
        const source = giftSourceLabel(gift);
        const notes = giftDisplayNotes(gift);
        const dateLabel = `${gift.start}${gift.end ? ` → ${gift.end}` : " → ongoing"}`;
        const pokemonLabel = gift.pokemon ?? species?.name;

        return (
          <Card key={gift.id} className={claimed ? "opacity-70" : undefined}>
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-base">{gift.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {w.endingSoon ? (
                    <Badge variant="destructive">
                      {w.daysLeft === 0 ? "Ends today" : `${w.daysLeft}d left`}
                    </Badge>
                  ) : null}
                  {gift.shiny ? <Badge variant="secondary">Shiny</Badge> : null}
                  <Badge variant="outline">{gift.method}</Badge>
                  {claimed ? <Badge variant="secondary">Claimed</Badge> : null}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {gift.games.map((game) => (
                    <Badge key={game} variant="secondary">
                      {game}
                    </Badge>
                  ))}
                  {gift.region ? (
                    <Badge variant="outline">{gift.region}</Badge>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-foreground">{dateLabel}</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {pokemonLabel || species || source || notes ? (
                <div className="flex items-center gap-3">
                  {species ? (
                    <PokemonSprite
                      id={species.id}
                      style={spriteStyle}
                      shiny={Boolean(gift.shiny)}
                      slug={species.slug}
                      width={56}
                      height={56}
                      className="size-12 shrink-0 sm:size-14"
                      alt={pokemonLabel ?? species.name}
                    />
                  ) : null}
                  <div className="min-w-0 flex flex-col gap-0.5">
                    {pokemonLabel ? (
                      <span className="text-sm font-medium">
                        {pokemonLabel}
                        {gift.shiny ? " ★" : ""}
                      </span>
                    ) : null}
                    {notes ? (
                      <p className="text-sm text-muted-foreground">{notes}</p>
                    ) : null}
                    {source ? (
                      <span className="text-xs text-muted-foreground/80">
                        {source}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={claimed ? "outline" : "default"}
                  onClick={() => onToggle(gift.id)}
                >
                  {claimed ? "Unmark claimed" : "Mark claimed"}
                </Button>
                {gift.sourceUrl ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<a href={gift.sourceUrl} target="_blank" rel="noreferrer" />}
                    nativeButton={false}
                  >
                    Source
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
