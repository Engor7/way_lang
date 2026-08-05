import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { BackNav } from "@/components/back-nav";
import { getCourse } from "@/content";
import { db } from "@/db";
import { itemProgress } from "@/db/schema";
import { buildListeningSession } from "@/lib/listening";
import styles from "../course.module.scss";
import { ListeningTrainer } from "./listening-trainer";

export default async function ListenPage({
   params,
}: {
   params: Promise<{ courseId: string }>;
}) {
   const { courseId } = await params;
   const course = getCourse(courseId);
   if (!course) {
      notFound();
   }

   const rows = await db
      .select()
      .from(itemProgress)
      .where(eq(itemProgress.courseId, course.id));

   const questions = buildListeningSession(course, rows);

   return (
      <main className={styles.pageNarrow}>
         {questions.length === 0 ? (
            <>
               <header className={styles.headerTight}>
                  <BackNav backHref={`/course/${course.id}`} />
                  <p className={styles.note}>
                     Аудирование — тренировка на слух, на стадии освоения не
                     влияет.
                  </p>
               </header>
               <p className={styles.centerMuted}>Пока нечего тренировать.</p>
            </>
         ) : (
            <ListeningTrainer courseId={course.id} questions={questions} />
         )}
      </main>
   );
}
