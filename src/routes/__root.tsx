import { ClerkProvider } from "@clerk/tanstack-react-start";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { CloudSyncProvider } from "@/components/cloud-sync-provider";
import { GiftNotifier } from "@/components/gift-notifier";
import { useDexStore } from "@/lib/store";
import { countProgress } from "@/lib/dex-stats";
import nationalDex from "@/data/national-dex.json";
import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "Pokehome — Living Dex",
      },
      {
        name: "description",
        content:
          "Local-first Pokémon HOME living dex tracker with evolution charts and mystery gift alerts.",
      },
      { name: "theme-color", content: "#2f6a4a" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          {children}
          <Scripts />
        </ClerkProvider>
      </body>
    </html>
  );
}

function RootComponent() {
  const caughtByKey = useDexStore((s) => s.caughtByKey);
  const percent = useMemo(
    () => countProgress(nationalDex.boxes, caughtByKey).percent,
    [caughtByKey],
  );

  return (
    <TooltipProvider>
      <CloudSyncProvider>
        <AppShell progressPercent={percent}>
          <Outlet />
        </AppShell>
        <GiftNotifier />
        <Toaster />
      </CloudSyncProvider>
      {import.meta.env.DEV ? (
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      ) : null}
    </TooltipProvider>
  );
}