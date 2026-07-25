import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Для миграций лучше прямое подключение (без pgbouncer), если оно задано
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!url) {
   throw new Error("DATABASE_URL is not set (expected in .env.local)");
}

export default defineConfig({
   schema: "./src/db/schema.ts",
   out: "./drizzle",
   dialect: "postgresql",
   dbCredentials: {
      url,
   },
});
