# Way Lang

Web app for learning and training English.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4 + SASS
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
  style/      # global.css (Tailwind entry) + component-scoped *.module.scss
```
