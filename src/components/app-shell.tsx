import { Link, useRouterState } from "@tanstack/react-router";
import { SignInButton, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { GiftIcon, Grid2x2Icon, HomeIcon, LightbulbIcon, SettingsIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PokeballIcon, PokeballLogo } from "@/components/pokeball-logo";
import { useActiveGiftStats } from "@/hooks/use-active-gift-count";
import {
  Sidebar,
  SidebarContent,
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
  { to: "/tips", label: "Tips", icon: LightbulbIcon },
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

      <SidebarRail />
    </Sidebar>
  );
}

export function AppShell({
  children,
  progress,
}: {
  children: React.ReactNode;
  progress?: { caught: number; total: number; percent: number };
}) {
  const { activeCount, unclaimedCount } = useActiveGiftStats();

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
          {progress ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Progress value={progress.percent} className="h-1.5 flex-1" />
              <Badge variant="outline">
                {progress.caught}/{progress.total} · {progress.percent}%
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
        <div className="flex-1 px-4 py-4 md:px-6 md:py-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
