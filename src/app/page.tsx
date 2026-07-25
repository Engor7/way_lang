import { and, eq, gte } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { loginUser } from "@/app/actions";
import { SpeakableFontToggle } from "@/components/speakable-font-toggle";
import { listCourses } from "@/content";
import { db } from "@/db";
import { dailyStats, itemProgress } from "@/db/schema";
import { letterGrade } from "@/lib/exam";
import { STAGE_LEARNED, summarize } from "@/lib/mastery";
import { dailySeries, dayKey, periodStats } from "@/lib/stats";
import { getSessionUser } from "@/lib/user-auth";
import styles from "./home.module.scss";

const PERIODS = [
   { label: "Сегодня", days: 1 },
   { label: "Неделя", days: 7 },
   { label: "Месяц", days: 30 },
];

const barDateFormat = new Intl.DateTimeFormat("ru-RU", {
   day: "numeric",
   month: "short",
});

// «сегодня 12 — на 4 больше, чем вчера»
function compareToYesterday(today: number, yesterday: number): string {
   if (today === 0) {
      return "сегодня пока без ответов";
   }
   if (yesterday === 0) {
      return "вчера ответов не было";
   }
   if (today === yesterday) {
      return "столько же, сколько вчера";
   }
   return today > yesterday
      ? `на ${today - yesterday} больше, чем вчера`
      : `на ${yesterday - today} меньше, чем вчера`;
}

export default async function Home({
   searchParams,
}: {
   searchParams: Promise<{ error?: string }>;
}) {
   const [user, { error }] = await Promise.all([
      getSessionUser(),
      searchParams,
   ]);

   if (!user) {
      return (
         <main className="screen-center">
            <form action={loginUser} className={styles.loginForm}>
               <h1 className={styles.loginTitle}>Way Lang</h1>
               <input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  required
                  className="input"
               />
               {error && <p className={styles.loginError}>Неверный пароль</p>}
               <button type="submit" className="btn btn--primary btn--block">
                  Войти
               </button>
            </form>
         </main>
      );
   }

   const [rows, statRows] = await Promise.all([
      db.select().from(itemProgress).where(eq(itemProgress.userId, user.id)),
      db
         .select()
         .from(dailyStats)
         .where(
            and(
               eq(dailyStats.userId, user.id),
               gte(dailyStats.day, dayKey(new Date(), 29)),
            ),
         ),
   ]);

   const courses = listCourses();
   const totalItems = courses.reduce(
      (sum, course) => sum + summarize(course, []).total,
      0,
   );
   const learnedTotal = rows.filter(
      (row) => row.stage === STAGE_LEARNED,
   ).length;
   const overallPercent = Math.round((100 * learnedTotal) / totalItems);

   // Выучено за период — по learnedAt в границах московского дня
   function learnedSince(days: number): number {
      const from = dayKey(new Date(), days - 1);
      return rows.filter(
         (row) =>
            row.stage === STAGE_LEARNED &&
            row.learnedAt !== null &&
            dayKey(row.learnedAt) >= from,
      ).length;
   }

   const month = periodStats(statRows, 30);
   const grade = month.accuracy === null ? null : letterGrade(month.accuracy);

   // График активности: последние 30 дней, высота столбика — доля от максимума
   const series = dailySeries(statRows, 30);
   const maxAnswered = Math.max(...series.map((d) => d.answered));
   const todayAnswered = series[series.length - 1].answered;
   const yesterdayAnswered = series[series.length - 2].answered;
   const activeDays = series.filter((d) => d.answered > 0).length;
   const avgPerActiveDay =
      activeDays === 0 ? 0 : Math.round(month.answered / activeDays);

   return (
      <main className={styles.page}>
         <section className={styles.stats}>
            <p className={styles.percent}>{overallPercent}%</p>
            <div className="progress-track">
               <div
                  className="progress-fill"
                  style={{ width: `${overallPercent}%` }}
               />
            </div>
            <p className={styles.summary}>
               выучено {learnedTotal} из {totalItems}
               {grade !== null && (
                  <>
                     {" "}
                     · оценка <span className={styles.strong}>{grade}</span>
                  </>
               )}
            </p>

            <div className={styles.periods}>
               {PERIODS.map((period) => {
                  const stats = periodStats(statRows, period.days);
                  return (
                     <div key={period.label} className={styles.period}>
                        <p className={styles.periodLabel}>{period.label}</p>
                        <p className={styles.periodValue}>{stats.answered}</p>
                        <p className={styles.periodLabel}>
                           {stats.accuracy === null
                              ? "нет ответов"
                              : `${stats.accuracy}% верно`}
                        </p>
                        <p className={styles.periodLearned}>
                           +{learnedSince(period.days)} выучено
                        </p>
                     </div>
                  );
               })}
            </div>

            <div className={styles.chartBlock}>
               <div className={styles.chart}>
                  {series.map((d, i) => {
                     const isToday = i === series.length - 1;
                     const height =
                        maxAnswered === 0
                           ? 0
                           : Math.round((100 * d.answered) / maxAnswered);
                     return (
                        <div
                           key={d.day}
                           title={`${barDateFormat.format(new Date(d.day))}: ${d.answered}`}
                           className={`${styles.bar} ${
                              d.answered === 0
                                 ? ""
                                 : isToday
                                   ? styles.barToday
                                   : styles.barActive
                           }`}
                           style={{ height: `${Math.max(height, 4)}%` }}
                        />
                     );
                  })}
               </div>
               <p className={styles.chartCaption}>
                  {compareToYesterday(todayAnswered, yesterdayAnswered)}
                  {activeDays > 1 && ` · в среднем ${avgPerActiveDay} в день`}
               </p>
            </div>
         </section>

         <section className={styles.courses}>
            {courses.map((course) => {
               const courseRows = rows.filter(
                  (row) => row.courseId === course.id,
               );
               const summary = summarize(course, courseRows);
               const percent = Math.round(
                  (100 * summary.learned) / summary.total,
               );
               return (
                  <Link
                     key={course.id}
                     href={`/course/${course.id}`}
                     className={styles.courseLink}
                  >
                     <div className={styles.courseRow}>
                        <div>
                           <h3 className={styles.courseTitle}>
                              {course.title}
                           </h3>
                           <p className={styles.courseDescription}>
                              {course.description}
                           </p>
                        </div>
                        <ChevronRight size={18} className={styles.chevron} />
                     </div>
                     <div className={styles.courseProgress}>
                        <div className="progress-track">
                           <div
                              className="progress-fill"
                              style={{ width: `${percent}%` }}
                           />
                        </div>
                        <p className={styles.courseStats}>
                           Выучено {summary.learned} из {summary.total}
                           {summary.inProgress > 0 &&
                              ` · в процессе ${summary.inProgress}`}
                        </p>
                     </div>
                  </Link>
               );
            })}
         </section>

         <div className={styles.toggleWrap}>
            <SpeakableFontToggle />
         </div>
      </main>
   );
}
