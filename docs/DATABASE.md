# База данных: Neon + Drizzle + бэкапы

## Что используется

- **Neon** — serverless PostgreSQL, бесплатный тариф (0.5 GB), нативная интеграция с Vercel.
- **Drizzle ORM** — схема в `src/db/schema.ts`, клиент в `src/db/index.ts`, миграции в `drizzle/`.
- **Бэкапы** — GitHub Action (`.github/workflows/db-backup.yml`) ежедневно делает полный `pg_dump` и коммитит его в отдельный приватный репозиторий.

## Первичная настройка (один раз)

### 1. Создать базу Neon через Vercel

1. Vercel Dashboard → ваш проект → вкладка **Storage** → **Create Database** → **Neon** (Marketplace).
2. Согласиться с бесплатным планом, выбрать регион (ближайший к пользователям, например `eu-central-1`).
3. Vercel сам добавит `DATABASE_URL` в переменные окружения проекта.

### 2. Локальное окружение

```bash
cp .env.example .env.local
# вставить DATABASE_URL из Vercel (Settings → Environment Variables)
# или: npx vercel env pull .env.local
```

### 3. Применить схему

```bash
pnpm db:generate   # сгенерировать SQL-миграцию из src/db/schema.ts
pnpm db:migrate    # применить к базе
pnpm db:studio     # (опционально) веб-интерфейс для просмотра данных
```

### 4. Настроить бэкапы

1. Создать **приватный** репозиторий для бэкапов, например `Engor7/way_lang-backups` (с README, чтобы была ветка `main`).
2. Создать fine-grained PAT: GitHub → Settings → Developer settings → **Fine-grained tokens** → доступ только к репо бэкапов, permission **Contents: Read and write**.
3. В репо `way_lang`: Settings → Secrets and variables → Actions → добавить секреты:
   - `DATABASE_URL` — **direct** строка подключения Neon (та, что `DATABASE_URL_UNPOOLED`, хост без `-pooler`) — `pg_dump` должен ходить мимо пулера;
   - `BACKUP_REPO` — `Engor7/way_lang-backups`;
   - `BACKUP_REPO_TOKEN` — созданный PAT.
4. Проверить вручную: вкладка **Actions** → workflow **DB Backup** → **Run workflow**.

## Как это работает дальше

- Каждый день в 03:00 UTC Action делает дамп (`pg_dump --format=custom`) и пушит его в `way_lang-backups/backups/way_lang-<дата>.dump`; свежая копия всегда лежит в `latest.dump`.
- В рабочем дереве хранятся последние 30 дампов; более старые остаются в git-истории репозитория бэкапов.
- Кроме того, у самого Neon на бесплатном тарифе есть point-in-time restore (история ~24 часа) — это защита от «ой, удалил не то», а дампы — долгосрочный полный бэкап.

## Восстановление из бэкапа

```bash
# в пустую базу (создать новую в Neon или очистить текущую)
pg_restore --no-owner --no-privileges --clean --if-exists \
  --dbname="$DATABASE_URL" latest.dump
```

## Изменение схемы

1. Правим `src/db/schema.ts`.
2. `pnpm db:generate` → появится новая миграция в `drizzle/`.
3. `pnpm db:migrate` — применить. Миграции коммитим в git.
