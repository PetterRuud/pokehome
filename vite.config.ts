import { defineConfig } from 'vite-plus';
import { devtools } from '@tanstack/devtools-vite';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';

import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

const config = defineConfig({
  lint: {
    plugins: ['oxc', 'typescript', 'unicorn', 'react'],
    // …about 100 rules expanded from the ESLint presets…
    ignorePatterns: ['**/routeTree.gen.ts'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ['**/routeTree.gen.ts'],
    semi: true,
    singleQuote: true,
    printWidth: 120,
  },
  resolve: { tsconfigPaths: true },
  plugins: [devtools(), cloudflare({ viteEnvironment: { name: 'ssr' } }), tailwindcss(), tanstackStart(), viteReact()],
});

export default config;
