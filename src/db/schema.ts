import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Стартовая таблица-пример: слова для изучения.
// Меняйте / добавляйте таблицы здесь, затем: pnpm db:generate && pnpm db:migrate
export const words = pgTable("words", {
   id: serial("id").primaryKey(),
   term: text("term").notNull(),
   translation: text("translation").notNull(),
   example: text("example"),
   repetitions: integer("repetitions").notNull().default(0),
   createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
});
