# Pokehome

Local-first living dex companion for Pokémon HOME collectors — track boxes offline, peek at simplified evolution charts, and keep an eye on mystery gifts. Optional Clerk sign-in syncs progress to Cloudflare D1 (last-write-wins).

## Stack

- TanStack Start (React) on Cloudflare Workers
- pnpm + vite-plus (`vp`)
- Zustand + IndexedDB (offline source of truth)
- Clerk (optional accounts) + D1 (cloud snapshot) + KV (PokéAPI cache)
- shadcn/ui with Base UI

## Develop

```bash
pnpm install
# copy Clerk keys
cp .env.example .env.local
# or: npx clerk@latest env pull
pnpm run dev
```

App: http://localhost:3000

Claim the Clerk app for production: `npx clerk@latest auth login` then `npx clerk@latest deploy`.

## Scripts

| Command                           | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `pnpm run dev`                    | Local Vite / Workers preview             |
| `pnpm run build`                  | Production build                         |
| `pnpm run preview`                | Preview production build                 |
| `pnpm run deploy`                 | Build + `wrangler deploy`                |
| `pnpm run cf-typegen`             | Regenerate Worker `Env` types            |
| `pnpm run generate-dex`           | Refresh national box layout from PokéAPI |
| `pnpm run generate-form-variants` | Mega/gmax eligibility + form ids         |

## Data

- Catch progress, prefs, gift claims: **browser IndexedDB** (export/import in Settings)
- When signed in: full snapshot upserted to **D1** `dex_snapshots` (newer `updated_at` wins)
- Species catalog: `src/data/national-dex.json`
- Mystery gifts: Serebii feed (daily cron) with last-good / snapshot JSON fallback

## Cloudflare bindings

Configured in `wrangler.jsonc`:

- **D1** `DB` — user dex snapshots (`migrations/0001_dex_snapshots.sql`)
- **KV** `POKE_CACHE` — PokéAPI species/evolution cache
- **Cron** `0 12 * * *` — refresh mystery gift feed

Apply migrations:

```bash
pnpm exec wrangler d1 migrations apply pokehome --local
pnpm exec wrangler d1 migrations apply pokehome --remote
```

Clerk on Cloudflare:

- `VITE_CLERK_PUBLISHABLE_KEY` — plain `vars` in [`wrangler.jsonc`](wrangler.jsonc) (public; safe to commit)
- `CLERK_SECRET_KEY` — Worker secret only (never in git):

```bash
pnpm exec wrangler secret put CLERK_SECRET_KEY
```

For Cloudflare Builds, also set `VITE_CLERK_PUBLISHABLE_KEY` as a **build** variable so Vite can inline it.
