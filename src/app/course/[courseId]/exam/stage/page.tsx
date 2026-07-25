import { and, desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import {
   buildChoiceOptions,
   getCourse,
   getItem,
   questionPrompt,
} from "@/content";
import { db } from "@/db";
import { examAttempts } from "@/db/schema";
import { requireUser } from "@/lib/user-auth";
import styles from "../../course.module.scss";
import { StageClient, type StageQuestion } from "./stage-client";

export default async function ExamStagePage({
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

   const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(
         and(
            eq(examAttempts.userId, user.id),
            eq(examAttempts.courseId, course.id),
            eq(examAttempts.status, "in_progress"),
         ),
      )
      .orderBy(desc(examAttempts.startedAt))
      .limit(1);
   if (!attempt) {
      redirect(`/course/${course.id}/exam`);
   }

   const stageIndex = attempt.stageResults.length;
   const stage = attempt.plan[stageIndex];
   if (!stage) {
      redirect(`/course/${course.id}/exam`);
   }

   const questions: StageQuestion[] = stage.map((q) => {
      const item = getItem(course, q.itemId);
      if (!item) {
         throw new Error(`Unknown exam item: ${q.itemId}`);
      }
      const prompt = questionPrompt(course, item, q.direction);
      return {
         kind: q.kind,
         direction: q.direction,
         prompt,
         hint: item.hint,
         options:
            q.kind === "choice"
               ? buildChoiceOptions(course, item, q.direction)
               : undefined,
         // озвучиваем только английские вопросы; ответы в тесте не подсказываем
         promptEn: q.direction === "from-en" ? prompt : undefined,
      };
   });

   return (
      <main className={styles.pageNarrow}>
         <header className={styles.headerTight}>
            <h1 className={styles.titleSm}>{course.title} — супер-тест</h1>
            <p className={styles.muted}>
               Этап {stageIndex + 1} из {attempt.plan.length}. Ответы без
               подсказок, результат — в конце этапа.
            </p>
         </header>
         <StageClient
            courseId={course.id}
            attemptId={attempt.id}
            stageIndex={stageIndex}
            questions={questions}
         />
      </main>
   );
}
