# Way Lang

Web app for learning and training English.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- SASS (SCSS modules + global tokens/reset)
- next-themes (light / dark)
- Biome (lint + format), Prettier (SCSS/CSS)
- pnpm

## Commands

```bash
pnpm dev              # start dev server
pnpm build            # production build
pnpm start            # run production server
pnpm lint             # Biome check
pnpm format           # Biome format
pnpm format:prettier  # Prettier for SCSS/CSS
```

## Structure

```
src/
  app/        # App Router: pages, layouts, route handlers
  style/      # global.scss (tokens, reset, shared UI classes); page styles in *.module.scss
```
