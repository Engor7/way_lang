import { desc } from "drizzle-orm";
import { Plus, Save, Trash2 } from "lucide-react";
import { createUser, deleteUser, updateUser } from "@/app/admin/actions";
import { listCourses } from "@/content";
import { db } from "@/db";
import { examAttempts, itemProgress, users } from "@/db/schema";
import { summarize } from "@/lib/mastery";
import styles from "../admin.module.scss";
import { ResetCourseButton } from "./reset-course-button";

const inputClass = "input input--sm";

const dateFormat = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short" });

export default async function AdminUsersPage({
   searchParams,
}: {
   searchParams: Promise<{ error?: string }>;
}) {
   const [allUsers, progressRows, attempts, { error }] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(itemProgress),
      db.select().from(examAttempts).orderBy(desc(examAttempts.startedAt)),
      searchParams,
   ]);

   // Прогресс пользователя по курсу: сводка по элементам + лучший результат
   // супер-теста. null — курс не начат.
   function courseProgress(userId: number, courseId: string) {
      const course = listCourses().find((c) => c.id === courseId);
      if (!course) {
         return null;
      }
      const rows = progressRows.filter(
         (row) => row.userId === userId && row.courseId === courseId,
      );
      const userAttempts = attempts.filter(
         (a) => a.userId === userId && a.courseId === courseId,
      );
      if (rows.length === 0 && userAttempts.length === 0) {
         return null;
      }
      const finished = userAttempts.filter((a) => a.status === "finished");
      const best = finished.reduce(
         (acc: (typeof finished)[number] | undefined, a) =>
            acc === undefined || (a.percent ?? 0) > (acc.percent ?? 0)
               ? a
               : acc,
         undefined,
      );
      return {
         course,
         summary: summarize(course, rows),
         best,
         activeExam: userAttempts.some((a) => a.status === "in_progress"),
      };
   }

   return (
      <main className={styles.stack}>
         {error === "duplicate" && (
            <p className={styles.alert}>
               Такой пароль-код уже занят другим пользователем — коды должны
               быть уникальными.
            </p>
         )}

         <section>
            <h2 className={styles.sectionTitle}>Новый пользователь</h2>
            <form action={createUser} className={styles.createForm}>
               <input
                  name="name"
                  placeholder="Имя"
                  required
                  className={inputClass}
               />
               <input
                  name="password"
                  placeholder="Пароль-код (пусто — сгенерируем)"
                  className={inputClass}
               />
               <button type="submit" className="btn btn--primary btn--sm">
                  <Plus size={14} />
                  Создать
               </button>
            </form>
         </section>

         <section>
            <h2 className={styles.sectionTitle}>
               Пользователи{" "}
               <span className={styles.count}>({allUsers.length})</span>
            </h2>
            {allUsers.length === 0 ? (
               <p className={styles.empty}>Пока никого.</p>
            ) : (
               <ul className={styles.userList}>
                  {allUsers.map((user) => (
                     <li key={user.id} className={styles.userCard}>
                        <form action={updateUser} className={styles.userForm}>
                           <input type="hidden" name="id" value={user.id} />
                           <input
                              name="name"
                              defaultValue={user.name}
                              required
                              title="Имя"
                              className={inputClass}
                           />
                           <input
                              name="password"
                              defaultValue={user.password}
                              required
                              title="Пароль-код для входа"
                              className={`${inputClass} ${styles.mono}`}
                           />
                           <span className={styles.date} title="Дата создания">
                              {dateFormat.format(user.createdAt)}
                           </span>
                           <button
                              type="submit"
                              title="Сохранить"
                              className="btn btn--outline btn--icon"
                           >
                              <Save size={14} />
                           </button>
                           <button
                              type="submit"
                              formAction={deleteUser}
                              formNoValidate
                              title="Удалить"
                              className="btn btn--danger-outline btn--icon"
                           >
                              <Trash2 size={14} />
                           </button>
                        </form>
                        {listCourses().map((course) => {
                           const progress = courseProgress(user.id, course.id);
                           if (!progress) {
                              return null;
                           }
                           return (
                              <div key={course.id} className={styles.courseRow}>
                                 <span>
                                    {course.title}: выучено{" "}
                                    {progress.summary.learned}/
                                    {progress.summary.total}
                                    {progress.summary.inProgress > 0 &&
                                       ` · в процессе ${progress.summary.inProgress}`}
                                    {progress.best &&
                                       ` · тест: ${progress.best.percent}% (${progress.best.grade})`}
                                    {progress.activeExam &&
                                       " · тест не завершён"}
                                 </span>
                                 <ResetCourseButton
                                    userId={user.id}
                                    userName={user.name}
                                    courseId={course.id}
                                    courseTitle={course.title}
                                 />
                              </div>
                           );
                        })}
                     </li>
                  ))}
               </ul>
            )}
         </section>
      </main>
   );
}
