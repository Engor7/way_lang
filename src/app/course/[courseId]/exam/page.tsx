import { and, desc, eq } from "drizzle-orm";
import { GraduationCap, RotateCcw } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackNav } from "@/components/back-nav";
import { getCourse } from "@/content";
import { db } from "@/db";
import { examAttempts } from "@/db/schema";
import { requireUser } from "@/lib/user-auth";
import styles from "../course.module.scss";
import { restartExam, startExam } from "./actions";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short" });

const GRADE_COLORS: Record<string, string> = {
   A: styles.gradeGood,
   B: styles.gradeGood,
   C: styles.gradeMid,
   D: styles.gradeMid,
   F: styles.gradeBad,
};

export default async function ExamPage({
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

   const attempts = await db
      .select()
      .from(examAttempts)
      .where(
         and(
            eq(examAttempts.userId, user.id),
            eq(examAttempts.courseId, course.id),
         ),
      )
      .orderBy(desc(examAttempts.startedAt));

   const active = attempts.find((a) => a.status === "in_progress");
   const finished = attempts.filter((a) => a.status === "finished");
   const latest = finished[0];
   const best = finished.reduce(
      (acc: (typeof finished)[number] | undefined, a) =>
         acc === undefined || (a.percent ?? 0) > (acc.percent ?? 0) ? a : acc,
      undefined,
   );

   return (
      <main className={styles.pageNarrow}>
         <header className={styles.header}>
            <BackNav backHref={`/course/${course.id}`} />
            <h1 className={`${styles.titleIcon} ${styles.title}`}>
               <GraduationCap size={24} />
               Супер-тест
            </h1>
            <p className={styles.muted}>
               Проверка всей карточки сразу: {course.examStages} этапа, можно
               проходить с перерывами. Итог — процент и оценка от A до F.
            </p>
         </header>

         {active ? (
            <section className={styles.sectionLg}>
               <h2 className={styles.sectionTitle}>
                  Попытка в процессе: этап {active.stageResults.length + 1} из{" "}
                  {active.plan.length}
               </h2>
               {active.stageResults.length > 0 && (
                  <ul className={styles.stageList}>
                     {active.stageResults.map((result, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: список этапов append-only, индекс = номер этапа
                        <li key={`${active.id}-${i}`}>
                           Этап {i + 1}: {result.correct} из {result.total}
                        </li>
                     ))}
                  </ul>
               )}
               <div className={styles.actions}>
                  <Link
                     href={`/course/${course.id}/exam/stage`}
                     className="btn btn--primary"
                  >
                     Продолжить: этап {active.stageResults.length + 1}
                  </Link>
                  <form action={restartExam}>
                     <input type="hidden" name="courseId" value={course.id} />
                     <button
                        type="submit"
                        className={`btn btn--outline ${styles.fullBtn}`}
                     >
                        <RotateCcw size={14} />
                        Сбросить и начать заново
                     </button>
                  </form>
               </div>
            </section>
         ) : (
            <section className={styles.sectionLg}>
               {latest ? (
                  <div className={styles.resultBlock}>
                     <p
                        className={`${styles.grade} ${GRADE_COLORS[latest.grade ?? "F"]}`}
                     >
                        {latest.grade}
                     </p>
                     <p className={styles.mutedBase}>
                        Последний результат: {latest.percent}%
                     </p>
                     {best && best.id !== latest.id && (
                        <p className={styles.muted}>
                           Лучший: {best.percent}% ({best.grade})
                        </p>
                     )}
                  </div>
               ) : (
                  <p className={styles.muted}>
                     Вы ещё не проходили супер-тест по этой карточке.
                  </p>
               )}
               <form action={startExam} className={styles.actions}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <button type="submit" className="btn btn--primary">
                     {latest ? "Пройти ещё раз" : "Начать супер-тест"}
                  </button>
               </form>
            </section>
         )}

         {finished.length > 0 && (
            <section className={styles.sectionSm}>
               <h2 className={styles.sectionTitle}>История</h2>
               <ul className={styles.rowList}>
                  {finished.slice(0, 10).map((attempt) => (
                     <li key={attempt.id}>
                        <span className={styles.mutedBase}>
                           {attempt.finishedAt
                              ? dateFormat.format(attempt.finishedAt)
                              : "—"}
                        </span>
                        <span
                           className={`${styles.strong} ${GRADE_COLORS[attempt.grade ?? "F"]}`}
                        >
                           {attempt.percent}% · {attempt.grade}
                        </span>
                     </li>
                  ))}
               </ul>
            </section>
         )}
      </main>
   );
}
