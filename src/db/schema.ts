import {
   date,
   integer,
   jsonb,
   pgTable,
   primaryKey,
   serial,
   text,
   timestamp,
} from "drizzle-orm/pg-core";
import type { QuestionKind } from "@/content/types";

// Пользователи. Вход на сайте — только по паролю-коду, поэтому он уникален
// и служит идентификатором. Создаются в админке (/admin).
export const users = pgTable("users", {
   id: serial("id").primaryKey(),
   name: text("name").notNull(),
   password: text("password").notNull().unique(),
   createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
});

// Прогресс пользователя по элементу курса. Курсы и элементы живут в коде
// (src/content), тут только строковые id. stage: 0 — флеш-карточка,
// 1 — выбор из вариантов, 2 — ввод текста, 3 — выучено.
export const itemProgress = pgTable(
   "item_progress",
   {
      userId: integer("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      courseId: text("course_id").notNull(),
      itemId: text("item_id").notNull(),
      stage: integer("stage").notNull().default(0),
      streak: integer("streak").notNull().default(0),
      correct: integer("correct").notNull().default(0),
      wrong: integer("wrong").notNull().default(0),
      learnedAt: timestamp("learned_at", { withTimezone: true }),
      updatedAt: timestamp("updated_at", { withTimezone: true })
         .notNull()
         .defaultNow(),
   },
   (table) => [
      primaryKey({ columns: [table.userId, table.courseId, table.itemId] }),
   ],
);

// Дневная активность пользователя по всем курсам сразу: сколько ответов дано
// и сколько из них верных. Инкрементится upsert'ом из тренажёра и экзамена,
// питает блок «достижения» на главной (день / неделя / месяц).
export const dailyStats = pgTable(
   "daily_stats",
   {
      userId: integer("user_id")
         .notNull()
         .references(() => users.id, { onDelete: "cascade" }),
      day: date("day").notNull(),
      answered: integer("answered").notNull().default(0),
      correct: integer("correct").notNull().default(0),
   },
   (table) => [primaryKey({ columns: [table.userId, table.day] })],
);

// План попытки супер-теста: этапы с вопросами. Фиксируется при создании
// попытки, чтобы обновление страницы или пауза не меняли вопросы.
export type ExamQuestion = {
   itemId: string;
   kind: Exclude<QuestionKind, "flashcard">;
   direction: "to-en" | "from-en";
};
export type ExamPlan = ExamQuestion[][];
export type StageResult = { correct: number; total: number };

// Попытки супер-теста. Активная попытка пользователя по курсу — последняя
// со status = in_progress; завершённые дают лучший/последний результат.
export const examAttempts = pgTable("exam_attempts", {
   id: serial("id").primaryKey(),
   userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
   courseId: text("course_id").notNull(),
   status: text("status").notNull().default("in_progress"),
   plan: jsonb("plan").$type<ExamPlan>().notNull(),
   stageResults: jsonb("stage_results")
      .$type<StageResult[]>()
      .notNull()
      .default([]),
   percent: integer("percent"),
   grade: text("grade"),
   startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
   finishedAt: timestamp("finished_at", { withTimezone: true }),
});
