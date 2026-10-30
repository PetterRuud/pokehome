import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, GiftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type GiftsCardProps = {
  activeGiftCount: number;
  unclaimedGiftCount: number;
  endingSoonCount: number;
  giftBadge: number;
};

export function GiftsCard({
  activeGiftCount,
  unclaimedGiftCount,
  endingSoonCount,
  giftBadge,
}: GiftsCardProps) {
  return (
    <Card className="animate-in fade-in-0 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <GiftIcon className="size-4" />
          Mystery gifts
          {giftBadge > 0 ? <Badge variant="secondary">{giftBadge}</Badge> : null}
        </CardTitle>
        <CardDescription>
          {activeGiftCount === 0
            ? 'No active gifts right now · live feed from Serebii'
            : unclaimedGiftCount > 0
              ? `${unclaimedGiftCount} unclaimed of ${activeGiftCount} active`
              : `${activeGiftCount} active · all claimed`}
          {endingSoonCount > 0 ? ` · ${endingSoonCount} ending soon` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" render={<Link to="/gifts" />} nativeButton={false} className="w-full">
          View gifts
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </CardContent>
    </Card>
  );
}
