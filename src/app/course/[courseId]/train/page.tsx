import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BackNav } from "@/components/back-nav";
import { getCourse } from "@/content";
import { db } from "@/db";
import { itemProgress } from "@/db/schema";
import { buildSession } from "@/lib/mastery";
import { requireUser } from "@/lib/user-auth";
import styles from "../course.module.scss";
import { Trainer } from "./trainer";

export default async function TrainPage({
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

   const rows = await db
      .select()
      .from(itemProgress)
      .where(
         and(
            eq(itemProgress.userId, user.id),
            eq(itemProgress.courseId, course.id),
         ),
      );

   const questions = buildSession(course, rows);

   return (
      <main className={styles.pageNarrow}>
         {questions.length === 0 ? (
            <>
               <header>
                  <BackNav backHref={`/course/${course.id}`} />
               </header>
               <p className={styles.centerMuted}>Пока нечего тренировать.</p>
            </>
         ) : (
            <Trainer courseId={course.id} questions={questions} />
         )}
      </main>
   );
}
