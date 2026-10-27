import { ClerkProvider } from '@clerk/tanstack-react-start';
import { shadcn } from '@clerk/ui/themes';
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app-shell';
import { CloudSyncProvider } from '@/components/cloud-sync-provider';
import { GiftNotifier } from '@/components/gift-notifier';
import { useShellProgress } from '@/hooks/use-shell-progress';
import appCss from '../styles.css?url';

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: 'Pokehome — Living Dex',
      },
      {
        name: 'description',
        content: 'Local-first Pokémon HOME living dex tracker with evolution charts and mystery gift alerts.',
      },
      { name: 'theme-color', content: '#2f6a4a' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'apple-touch-icon', href: '/favicon.svg' },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 py-12">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>That route doesn’t exist. Head back home or open the living dex.</EmptyDescription>
        </EmptyHeader>
      </Empty>
      <div className="flex flex-wrap justify-center gap-2">
        <Button render={<Link to="/" />} nativeButton={false}>
          Home
        </Button>
        <Button variant="outline" render={<Link to="/dex" />} nativeButton={false}>
          Open dex
        </Button>
      </div>
    </div>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
          <Scripts />
        </ClerkProvider>
      </body>
    </html>
  );
}

function RootComponent() {
  const progress = useShellProgress();

  return (
    <TooltipProvider>
      <CloudSyncProvider>
        <AppShell progress={progress}>
          <Outlet />
        </AppShell>
        <GiftNotifier />
        <Toaster />
      </CloudSyncProvider>
      {import.meta.env.DEV ? (
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
      ) : null}
    </TooltipProvider>
  );
}
