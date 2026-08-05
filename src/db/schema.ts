import {
   integer,
   primaryKey,
   sqliteTable,
   text,
} from "drizzle-orm/sqlite-core";
import type { QuestionKind } from "@/content/types";

// Пользователь один — тот, кто открыл сайт. Никаких user_id в таблицах.

// Прогресс по элементу курса. Курсы и элементы живут в коде (src/content),
// тут только строковые id. stage: 0 — флеш-карточка, 1 — выбор из вариантов,
// 2 — ввод текста, 3 — выучено.
export const itemProgress = sqliteTable(
   "item_progress",
   {
      courseId: text("course_id").notNull(),
      itemId: text("item_id").notNull(),
      stage: integer("stage").notNull().default(0),
      streak: integer("streak").notNull().default(0),
      correct: integer("correct").notNull().default(0),
      wrong: integer("wrong").notNull().default(0),
      learnedAt: integer("learned_at", { mode: "timestamp" }),
      updatedAt: integer("updated_at", { mode: "timestamp" })
         .notNull()
         .$defaultFn(() => new Date()),
   },
   (table) => [primaryKey({ columns: [table.courseId, table.itemId] })],
);

// Дневная активность по всем курсам сразу: сколько ответов дано и сколько
// из них верных. Инкрементится upsert'ом из тренажёра и экзамена, питает
// блок «достижения» на главной (день / неделя / месяц). day — "YYYY-MM-DD".
export const dailyStats = sqliteTable("daily_stats", {
   day: text("day").primaryKey(),
   answered: integer("answered").notNull().default(0),
   correct: integer("correct").notNull().default(0),
});

// План попытки супер-теста: этапы с вопросами. Фиксируется при создании
// попытки, чтобы обновление страницы или пауза не меняли вопросы.
export type ExamQuestion = {
   itemId: string;
   kind: Exclude<QuestionKind, "flashcard">;
   direction: "to-en" | "from-en";
};
export type ExamPlan = ExamQuestion[][];
export type StageResult = { correct: number; total: number };

// Попытки супер-теста. Активная попытка по курсу — последняя со
// status = in_progress; завершённые дают лучший/последний результат.
export const examAttempts = sqliteTable("exam_attempts", {
   id: integer("id").primaryKey({ autoIncrement: true }),
   courseId: text("course_id").notNull(),
   status: text("status").notNull().default("in_progress"),
   plan: text("plan", { mode: "json" }).$type<ExamPlan>().notNull(),
   stageResults: text("stage_results", { mode: "json" })
      .$type<StageResult[]>()
      .notNull()
      .$defaultFn(() => []),
   percent: integer("percent"),
   grade: text("grade"),
   startedAt: integer("started_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
   finishedAt: integer("finished_at", { mode: "timestamp" }),
});
