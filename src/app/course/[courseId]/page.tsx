import { and, desc, eq } from "drizzle-orm";
import { ArrowLeft, GraduationCap, Headphones, Play } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/content";
import { db } from "@/db";
import { examAttempts, itemProgress } from "@/db/schema";
import { levelBreakdown, summarize } from "@/lib/mastery";
import { requireUser } from "@/lib/user-auth";
import styles from "./course.module.scss";

export default async function CoursePage({
   params,
}: {
   params: Promise<{ courseId: string }>;
}) {
   const user = await requireUser();
   const { courseId } = await params;
   const course = getCourse(courseId);
   if (!course) {
      notFound();
   }

   const [rows, attempts] = await Promise.all([
      db
         .select()
         .from(itemProgress)
         .where(
            and(
               eq(itemProgress.userId, user.id),
               eq(itemProgress.courseId, course.id),
            ),
         ),
      db
         .select()
         .from(examAttempts)
         .where(
            and(
               eq(examAttempts.userId, user.id),
               eq(examAttempts.courseId, course.id),
            ),
         )
         .orderBy(desc(examAttempts.startedAt)),
   ]);

   const summary = summarize(course, rows);
   const levels = levelBreakdown(course, rows);
   const percent = Math.round((100 * summary.learned) / summary.total);

   const active = attempts.find((a) => a.status === "in_progress");
   const finished = attempts.filter((a) => a.status === "finished");
   const latest = finished[0];
   const best = finished.reduce(
      (acc: (typeof finished)[number] | undefined, a) =>
         acc === undefined || (a.percent ?? 0) > (acc.percent ?? 0) ? a : acc,
      undefined,
   );

   return (
      <main className={styles.page}>
         <header className={styles.header}>
            <Link href="/" className={styles.backLink}>
               <ArrowLeft size={14} className={styles.backArrow} />
               На главную
            </Link>
            <div>
               <h1 className={styles.title}>{course.title}</h1>
               <p className={styles.muted}>{course.description}</p>
            </div>
         </header>

         <section className={styles.section}>
            <div className={styles.rowBetween}>
               <h2 className={styles.sectionTitle}>Прогресс</h2>
               <span className={styles.muted}>{percent}%</span>
            </div>
            <div className="progress-track progress-track--lg">
               <div
                  className="progress-fill"
                  style={{ width: `${percent}%` }}
               />
            </div>
            <p className={styles.muted}>
               Выучено {summary.learned} · в процессе {summary.inProgress} ·
               осталось {summary.remaining}
            </p>
            <div className={styles.actions}>
               <Link
                  href={`/course/${course.id}/train`}
                  className="btn btn--primary"
               >
                  <Play size={16} />
                  Тренировка
               </Link>
               <Link
                  href={`/course/${course.id}/listen`}
                  className={`btn btn--outline ${styles.strong}`}
               >
                  <Headphones size={16} />
                  Аудирование
               </Link>
            </div>
         </section>

         <section className={styles.sectionSm}>
            <h2 className={styles.sectionTitle}>Уровни</h2>
            <ul className={styles.rowList}>
               {levels.map((level) => (
                  <li key={level.levelId}>
                     <span>{level.title}</span>
                     <span
                        className={
                           level.learned === level.total
                              ? styles.levelDone
                              : styles.mutedBase
                        }
                     >
                        {level.learned}/{level.total}
                     </span>
                  </li>
               ))}
            </ul>
         </section>

         <section className={styles.section}>
            <h2 className={`${styles.titleIcon} ${styles.sectionTitle}`}>
               <GraduationCap size={18} />
               Супер-тест
            </h2>
            {active ? (
               <p className={styles.muted}>
                  Попытка в процессе: этап {active.stageResults.length + 1} из{" "}
                  {active.plan.length}
               </p>
            ) : (
               <p className={styles.muted}>
                  Экзамен по всей карточке: {course.examStages} этапа, итог —
                  оценка от A до F. Можно пересдавать сколько угодно.
               </p>
            )}
            {(latest || best) && (
               <p className={styles.muted}>
                  {best && `Лучший результат: ${best.percent}% (${best.grade})`}
                  {latest &&
                     latest.id !== best?.id &&
                     ` · последний: ${latest.percent}% (${latest.grade})`}
               </p>
            )}
            <div className={styles.actions}>
               <Link
                  href={`/course/${course.id}/exam`}
                  className={`btn btn--outline ${styles.strong}`}
               >
                  {active ? "Продолжить супер-тест" : "К супер-тесту"}
               </Link>
            </div>
         </section>
      </main>
   );
}
