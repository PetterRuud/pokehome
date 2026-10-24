import { Link, useRouterState } from "@tanstack/react-router";
import {
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/tanstack-react-start";
import { GiftIcon, HomeIcon, SettingsIcon, Grid2x2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PokeballIcon, PokeballLogo } from "@/components/pokeball-logo";
import { useActiveGiftStats } from "@/hooks/use-active-gift-count";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { to: "/", label: "Home", icon: HomeIcon },
  { to: "/dex", label: "Dex", icon: Grid2x2Icon },
  { to: "/gifts", label: "Gifts", icon: GiftIcon },
] as const;

const settingsNav = {
  to: "/settings",
  label: "Settings",
  icon: SettingsIcon,
} as const;

const nav = [...mainNav, settingsNav] as const;

function isActivePath(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

/** Avoid Clerk `<Show>` returning null while auth loads — that mismatches SSR HTML. */
function SidebarAuthItem() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <UserButton
          appearance={{
            elements: { avatarBox: "size-8" },
          }}
        />
        <span className="truncate text-sm group-data-[collapsible=icon]:hidden">Account</span>
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <SidebarMenuButton tooltip="Sign in">
        <span className="flex size-4 items-center justify-center rounded-full border border-sidebar-border text-[10px] font-semibold">
          ?
        </span>
        <span>Sign in</span>
      </SidebarMenuButton>
    </SignInButton>
  );
}

function HeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return <UserButton />;
  }

  return (
    <SignInButton mode="modal">
      <Button variant="outline" size="sm">
        Sign in
      </Button>
    </SignInButton>
  );
}

function AppSidebar({
  activeGiftCount,
  unclaimedGiftCount,
}: {
  activeGiftCount: number;
  unclaimedGiftCount: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();
  const giftBadge = unclaimedGiftCount > 0 ? unclaimedGiftCount : activeGiftCount;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Pokehome"
              render={<Link to="/" />}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <PokeballIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Pokehome</span>
                <span className="truncate text-xs text-muted-foreground">Living dex companion</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((item) => {
                const Icon = item.icon;
                const isGifts = item.to === "/gifts";
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={isActivePath(pathname, item.to)}
                      tooltip={
                        isGifts && giftBadge > 0
                          ? unclaimedGiftCount > 0
                            ? `${item.label} (${unclaimedGiftCount} unclaimed)`
                            : `${item.label} (${activeGiftCount})`
                          : item.label
                      }
                      render={<Link to={item.to} />}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    {isGifts && giftBadge > 0 ? (
                      <SidebarMenuBadge>{giftBadge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarAuthItem />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

function MobileBottomNav({ giftBadge }: { giftBadge: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-safe backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 pt-2">
        {nav.map((item) => {
          const active = isActivePath(pathname, item.to);
          const Icon = item.icon;
          const isGifts = item.to === "/gifts";
          return (
            <Button
              key={item.to}
              variant="ghost"
              className={cn(
                "relative h-auto min-h-11 flex-col gap-0.5 rounded-lg text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
              render={<Link to={item.to} />}
              nativeButton={false}
            >
              <span className="relative">
                <Icon className="size-5" />
                {isGifts && giftBadge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground tabular-nums">
                    {giftBadge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  children,
  progressPercent,
}: {
  children: React.ReactNode;
  progressPercent?: number;
}) {
  const { activeCount, unclaimedCount } = useActiveGiftStats();
  const giftBadge = unclaimedCount > 0 ? unclaimedCount : activeCount;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar activeGiftCount={activeCount} unclaimedGiftCount={unclaimedCount} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Link
            to="/"
            className="shrink-0 text-foreground hover:opacity-90 md:hidden"
            aria-label="Pokehome home"
          >
            <PokeballLogo size="sm" showWordmark={false} />
          </Link>
          {typeof progressPercent === "number" ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Progress value={progressPercent} className="h-1.5 flex-1" />
              <Badge variant="outline" className="shrink-0 tabular-nums">
                {progressPercent}%
              </Badge>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="shrink-0">
            <HeaderAuth />
          </div>
        </header>


        {/* SidebarInset is already a <main> — nesting another breaks HTML hydration */}
        <div className="mb-nav flex-1 px-4 py-4 md:mb-0 md:px-6 md:py-6">{children}</div>

        <MobileBottomNav giftBadge={giftBadge} />
      </SidebarInset>
    </SidebarProvider>
  );
}
