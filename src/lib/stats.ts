// Дневная активность: запись ответов и агрегация за день / неделю / месяц.

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyStats } from "@/db/schema";

// Границы «дня» считаем по московскому времени: прод на Vercel живёт в UTC,
// и без этого вечерняя тренировка попадала бы в следующий день.
const TIME_ZONE = "Europe/Moscow";

// "YYYY-MM-DD" для даты в TIME_ZONE (en-CA даёт ровно этот формат)
export function dayKey(date = new Date(), daysAgo = 0): string {
   const shifted = new Date(date.getTime() - daysAgo * 24 * 60 * 60 * 1000);
   return shifted.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

// Инкремент дневного счётчика одним upsert'ом
export async function recordAnswers(
   answered: number,
   correct: number,
): Promise<void> {
   await db
      .insert(dailyStats)
      .values({ day: dayKey(), answered, correct })
      .onConflictDoUpdate({
         target: dailyStats.day,
         set: {
            answered: sql`${dailyStats.answered} + ${answered}`,
            correct: sql`${dailyStats.correct} + ${correct}`,
         },
      });
}

export type DailyRow = { day: string; answered: number; correct: number };

export type PeriodStats = {
   answered: number;
   correct: number;
   accuracy: number | null; // null — не было ответов
};

// Непрерывный ряд последних `days` дней (старые → сегодня), нули для дней
// без активности — для графика «сколько сделал по сравнению с другими днями»
export function dailySeries(rows: DailyRow[], days: number): DailyRow[] {
   const byDay = new Map(rows.map((row) => [row.day, row]));
   const out: DailyRow[] = [];
   for (let i = days - 1; i >= 0; i--) {
      const day = dayKey(new Date(), i);
      const row = byDay.get(day);
      out.push({
         day,
         answered: row?.answered ?? 0,
         correct: row?.correct ?? 0,
      });
   }
   return out;
}

// Сумма по строкам, чей день попадает в последние `days` дней (включая сегодня)
export function periodStats(rows: DailyRow[], days: number): PeriodStats {
   const from = dayKey(new Date(), days - 1);
   const inPeriod = rows.filter((row) => row.day >= from);
   const answered = inPeriod.reduce((sum, row) => sum + row.answered, 0);
   const correct = inPeriod.reduce((sum, row) => sum + row.correct, 0);
   return {
      answered,
      correct,
      accuracy: answered === 0 ? null : Math.round((100 * correct) / answered),
   };
}
