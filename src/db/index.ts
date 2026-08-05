// SQLite-клиент. Пользователь один, приложение крутится локально / на своём
// сервере — база это просто файл на диске (по умолчанию data/way-lang.db,
// путь можно переопределить переменной DATABASE_FILE).
//
// Миграции из drizzle/ применяются при старте: идемпотентно и дёшево, зато
// не бывает состояния «забыл выполнить pnpm db:migrate».

import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const DB_FILE = process.env.DATABASE_FILE ?? "data/way-lang.db";
const MIGRATIONS_DIR = "drizzle";

// Относительные пути node и drizzle разрешают от cwd — то есть от корня
// проекта, откуда запускается next.
function connect() {
   mkdirSync(path.dirname(DB_FILE), { recursive: true });
   const sqlite = new Database(DB_FILE);
   sqlite.pragma("journal_mode = WAL");
   const instance = drizzle(sqlite, { schema });
   migrate(instance, { migrationsFolder: MIGRATIONS_DIR });
   return instance;
}

// В dev каждый hot reload перевыполняет модуль — держим одно соединение
// на процесс, иначе накапливаются открытые хендлы к файлу.
const globalForDb = globalThis as unknown as {
   wayLangDb?: ReturnType<typeof connect>;
};

export const db = globalForDb.wayLangDb ?? connect();

if (process.env.NODE_ENV !== "production") {
   globalForDb.wayLangDb = db;
}
