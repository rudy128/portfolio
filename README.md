# Pratham Kamthan's portfolio

A fast Astro portfolio with a hydrated Svelte desktop. It manages independent application windows for Pratham's profile, projects, contact details, and terminal.

## Updating the content

Contact details and project entries live in `src/data/portfolio.ts`. The window manager lives in `src/components/desktop/Desktop.svelte`, while each window shell lives in `src/components/desktop/Window.svelte`.

The profile image uses Pratham's current public GitHub avatar.

## Commands

| Command | Action |
| :-- | :-- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the development server |
| `pnpm presence:dev` | Start the local WebSocket presence Worker on port 8787 |
| `pnpm presence:check` | Type-check and dry-run the presence Worker |
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm preview` | Preview the production build |

## Active connections

The security-system widget displays the number of open portfolio WebSocket connections. A Cloudflare Worker and Durable Object own the live connection set; no visitor history, location, or identity is stored.

Local development needs no environment file. Run `pnpm dev` and `pnpm presence:dev` in separate terminals, and the site will connect to `ws://localhost:8787/presence` automatically.

For production:

1. Deploy the Worker with `pnpm exec wrangler deploy --config presence-worker/wrangler.jsonc`.
2. Copy `.env.example` to `.env` and replace the placeholder with the deployed Worker URL.
3. Add the same `PUBLIC_PRESENCE_WS_URL` value to the portfolio host's production environment variables before rebuilding the site.

`PUBLIC_PRESENCE_WS_URL` is a public endpoint, not a secret. The Worker accepts the production alias and this project's generated Vercel deployment URLs. If the project name, Vercel scope, or production domain changes, update `ALLOWED_ORIGINS` in `presence-worker/wrangler.jsonc` before deploying the Worker.

Astro documentation: https://docs.astro.build
