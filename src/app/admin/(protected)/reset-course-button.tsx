"use client";

// Кнопка «Сбросить» с модалкой подтверждения: фон блюрится,
// сброс уходит server action'ом только после «Да».

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { resetCourseProgress } from "@/app/admin/actions";
import styles from "../admin.module.scss";

type Props = {
   userId: number;
   userName: string;
   courseId: string;
   courseTitle: string;
};

export function ResetCourseButton({
   userId,
   userName,
   courseId,
   courseTitle,
}: Props) {
   const [open, setOpen] = useState(false);

   return (
      <>
         <button
            type="button"
            onClick={() => setOpen(true)}
            title="Полный сброс: прогресс и результаты супер-теста"
            className={`btn btn--danger-outline ${styles.resetBtn}`}
         >
            <RotateCcw size={12} />
            Сбросить
         </button>

         {open && (
            <div className={styles.overlay}>
               <button
                  type="button"
                  aria-label="Закрыть"
                  onClick={() => setOpen(false)}
                  className={styles.scrim}
               />
               <div role="dialog" aria-modal="true" className={styles.dialog}>
                  <p className={styles.dialogTitle}>
                     Сбросить курс «{courseTitle}»?
                  </p>
                  <p className={styles.dialogText}>
                     Весь прогресс и результаты супер-теста пользователя{" "}
                     <span className={styles.strong}>{userName}</span> по этому
                     курсу будут удалены безвозвратно — как будто он не
                     приступал к курсу.
                  </p>
                  <div className={styles.dialogActions}>
                     <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="btn btn--outline"
                     >
                        Нет
                     </button>
                     <form action={resetCourseProgress}>
                        <input type="hidden" name="userId" value={userId} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button
                           type="submit"
                           className="btn btn--danger btn--block"
                        >
                           Да, сбросить
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </>
   );
}
