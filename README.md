# Way Lang

Web app for learning and training English. Приложение для одного пользователя: никакой авторизации, прогресс лежит в локальном файле SQLite (`data/way-lang.db`, создаётся сам при первом запуске).

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- SASS (SCSS modules + global tokens/reset)
- next-themes (light / dark)
- SQLite (better-sqlite3) + Drizzle ORM
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

pnpm vocab:build      # пересобрать курсы из morewords.txt
pnpm phrases:build    # пересобрать курс «500 полезных фраз»
pnpm audio:generate   # доозвучить новые английские строки (edge-tts)
pnpm db:generate      # сгенерировать миграцию после правки схемы
pnpm db:studio        # веб-интерфейс к базе
```

## Structure

```
src/
  app/        # App Router: pages, layouts, route handlers
  content/    # курсы: numbers, top100, verbs, phrases + тематические из morewords.txt
  db/         # drizzle client и схема
  lib/        # освоение карточек, экзамен, аудирование, озвучка
  style/      # global.scss (tokens, reset, shared UI classes)
scripts/      # сборка курсов и генерация озвучки
morewords.txt # словарь-источник тематических курсов
500 полезных английских фраз.txt # источник курса phrases
```

Подробности — `CLAUDE.md` и `docs/DATABASE.md`.
