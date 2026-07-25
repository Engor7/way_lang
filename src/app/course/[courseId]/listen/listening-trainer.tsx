"use client";

// Тренажёр аудирования: вопрос звучит (текст скрыт до ответа), пользователь
// выбирает перевод из 4 вариантов или печатает услышанное (диктант).
// Прогресс освоения не меняется — только дневная статистика.

import { RotateCcw, Volume2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BackNav } from "@/components/back-nav";
import { Speakable } from "@/components/speakable";
import type { CourseId } from "@/content/types";
import { speak, stopSpeech } from "@/lib/audio";
import type { ListeningQuestion } from "@/lib/listening";
import styles from "../course.module.scss";
import { type ListeningResult, submitListeningAnswer } from "./actions";

type Props = {
   courseId: CourseId;
   questions: ListeningQuestion[];
};

export function ListeningTrainer({ courseId, questions }: Props) {
   const [index, setIndex] = useState(0);
   const [typed, setTyped] = useState("");
   const [chosen, setChosen] = useState<string | null>(null);
   const [result, setResult] = useState<ListeningResult | null>(null);
   const [stats, setStats] = useState({ correct: 0, wrong: 0 });
   const [pending, startTransition] = useTransition();

   const question = questions[index] as ListeningQuestion | undefined;

   // озвучиваем вопрос при показе; при уходе со страницы обрываем звук
   const text = question?.text;
   useEffect(() => {
      if (text) {
         speak(text);
      }
   }, [text]);
   useEffect(() => stopSpeech, []);

   function advance() {
      setTyped("");
      setChosen(null);
      setResult(null);
      setIndex((i) => i + 1);
   }

   function submit(answer: string) {
      if (!question || pending) {
         return;
      }
      startTransition(async () => {
         const res = await submitListeningAnswer({
            courseId,
            itemId: question.itemId,
            kind: question.kind,
            answer,
         });
         setStats((s) => ({
            correct: s.correct + (res.correct ? 1 : 0),
            wrong: s.wrong + (res.correct ? 0 : 1),
         }));
         setResult(res);
      });
   }

   if (!question) {
      const total = stats.correct + stats.wrong;
      return (
         <div className={styles.trainer}>
            <BackNav backHref={`/course/${courseId}`} />
            <div className={styles.done}>
               <h2 className={styles.doneTitle}>Сессия завершена</h2>
               {total > 0 && (
                  <p className={styles.mutedBase}>
                     Правильно {stats.correct} из {total}
                  </p>
               )}
               <div className={styles.actions}>
                  <a
                     href={`/course/${courseId}/listen`}
                     className="btn btn--primary"
                  >
                     <RotateCcw size={16} />
                     Ещё одна сессия
                  </a>
                  <Link
                     href={`/course/${courseId}`}
                     className="btn btn--outline"
                  >
                     К карточке
                  </Link>
               </div>
            </div>
         </div>
      );
   }

   const progressLabel = `${Math.min(index + 1, questions.length)} / ${questions.length}`;

   return (
      <div className={styles.trainer}>
         <div className={styles.headerTight}>
            <div className={styles.trainerTop}>
               <BackNav backHref={`/course/${courseId}`} />
               <div className={styles.trainerMeta}>
                  <span>{progressLabel}</span>
                  {question.kind === "listening-typed" && <span>диктант</span>}
               </div>
            </div>
            <p className={styles.note}>
               Аудирование — тренировка на слух, на стадии освоения не влияет.
            </p>
         </div>

         <div className={styles.body}>
            <div className={styles.questionWrap}>
               <button
                  type="button"
                  onClick={() => speak(question.text)}
                  aria-label="Прослушать ещё раз"
                  title="Прослушать ещё раз"
                  className={`btn btn--outline ${styles.listenBtn}`}
               >
                  <Volume2 size={28} />
               </button>
               {question.hint && <p className={styles.hint}>{question.hint}</p>}
            </div>

            {question.kind === "listening-choice" && (
               <div className={styles.options}>
                  {question.options?.map((option) => {
                     const isChosen = chosen === option;
                     const isCorrectOption =
                        result !== null && option === result.translation;
                     let cls = styles.option;
                     if (result === null) {
                        cls += ` ${styles.optionIdle}`;
                     } else if (isCorrectOption) {
                        cls += ` ${styles.optionCorrect}`;
                     } else if (isChosen) {
                        cls += ` ${styles.optionWrong}`;
                     } else {
                        cls += ` ${styles.optionFaded}`;
                     }
                     return (
                        <button
                           key={option}
                           type="button"
                           disabled={pending || result !== null}
                           onClick={() => {
                              setChosen(option);
                              submit(option);
                           }}
                           className={cls}
                        >
                           {option}
                        </button>
                     );
                  })}
               </div>
            )}

            {question.kind === "listening-typed" && (
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     if (result === null && typed.trim() !== "") {
                        submit(typed);
                     }
                  }}
                  className={styles.typedForm}
               >
                  <input
                     // key: пересоздаём поле на каждом вопросе, иначе autoFocus
                     // не срабатывает при переходе «диктант → диктант»
                     key={index}
                     value={typed}
                     onChange={(e) => setTyped(e.target.value)}
                     placeholder="Что вы услышали? По-английски"
                     disabled={result !== null}
                     // biome-ignore lint/a11y/noAutofocus: поле появляется по ходу тренировки, фокус ожидаем
                     autoFocus
                     className={`input ${
                        result === null
                           ? ""
                           : result.correct
                             ? styles.inputCorrect
                             : styles.inputWrong
                     }`}
                  />
                  {result !== null && !result.correct && (
                     <p className={styles.feedback}>
                        <Speakable
                           text={result.textEn}
                           className={styles.strong}
                        />
                     </p>
                  )}
                  {result === null && (
                     <button
                        type="submit"
                        disabled={pending || typed.trim() === ""}
                        className="btn btn--primary btn--block"
                     >
                        Проверить
                     </button>
                  )}
               </form>
            )}
         </div>

         {result !== null && (
            <button
               type="button"
               onClick={advance}
               // biome-ignore lint/a11y/noAutofocus: кнопка появляется после ответа, Enter = «Дальше»
               autoFocus
               className="btn btn--primary btn--block"
            >
               Дальше
            </button>
         )}
      </div>
   );
}
