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
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm preview` | Preview the production build |

Astro documentation: https://docs.astro.build
