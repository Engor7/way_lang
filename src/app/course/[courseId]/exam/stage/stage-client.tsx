"use client";

// Этап супер-теста: вопросы по одному, без промежуточной проверки.
// Ответы копятся локально и отправляются одним запросом в конце этапа.

import { useEffect, useState, useTransition } from "react";
import { Speakable } from "@/components/speakable";
import { typedPlaceholder } from "@/content/placeholders";
import type { CourseStyle, Direction, QuestionKind } from "@/content/types";
import { speak, stopSpeech } from "@/lib/audio";
import styles from "../../course.module.scss";
import { submitExamStage } from "../actions";

export type StageQuestion = {
   kind: Exclude<QuestionKind, "flashcard">;
   direction: Direction;
   prompt: string;
   hint?: string;
   options?: string[];
   promptEn?: string; // prompt — английский: озвучить при показе вопроса
};

type Props = {
   courseStyle: CourseStyle;
   attemptId: number;
   stageIndex: number;
   questions: StageQuestion[];
};

export function StageClient({
   courseStyle,
   attemptId,
   stageIndex,
   questions,
}: Props) {
   const [index, setIndex] = useState(0);
   const [answers, setAnswers] = useState<string[]>([]);
   const [typed, setTyped] = useState("");
   const [pending, startTransition] = useTransition();

   const question = questions[index] as StageQuestion | undefined;

   // английский prompt озвучиваем при показе вопроса; на выходе обрываем звук
   const promptEn = question?.promptEn;
   useEffect(() => {
      if (promptEn) {
         speak(promptEn);
      }
   }, [promptEn]);
   useEffect(() => stopSpeech, []);

   function answer(value: string) {
      const next = [...answers, value];
      setAnswers(next);
      setTyped("");
      if (next.length === questions.length) {
         startTransition(() =>
            submitExamStage({ attemptId, stageIndex, answers: next }),
         );
      } else {
         setIndex((i) => i + 1);
      }
   }

   if (!question || answers.length === questions.length) {
      return <p className={styles.centerMuted}>Проверяем ответы этапа…</p>;
   }

   return (
      <div className={styles.trainer}>
         <div className={styles.trainerMeta}>
            <span>
               Вопрос {index + 1} / {questions.length}
            </span>
         </div>
         <div className="progress-track">
            <div
               className="progress-fill progress-fill--neutral"
               style={{ width: `${(100 * index) / questions.length}%` }}
            />
         </div>

         <div className={styles.body}>
            <div className={styles.questionWrap}>
               <p className={`question-accent ${styles.question}`}>
                  {question.promptEn ? (
                     <Speakable text={question.promptEn}>
                        {question.prompt}
                     </Speakable>
                  ) : (
                     question.prompt
                  )}
               </p>
               {question.hint && <p className={styles.hint}>{question.hint}</p>}
            </div>

            {question.kind === "choice" ? (
               <div className={styles.options}>
                  {question.options?.map((option) => (
                     <button
                        key={option}
                        type="button"
                        disabled={pending}
                        onClick={() => answer(option)}
                        className={`${styles.option} ${styles.optionIdle} ${styles.optionDim}`}
                     >
                        {option}
                     </button>
                  ))}
               </div>
            ) : (
               <form
                  onSubmit={(e) => {
                     e.preventDefault();
                     if (typed.trim() !== "") {
                        answer(typed);
                     }
                  }}
                  className={styles.typedForm}
               >
                  <input
                     // key: пересоздаём поле на каждом вопросе, иначе autoFocus
                     // не срабатывает при переходе «ввод → ввод»
                     key={index}
                     value={typed}
                     onChange={(e) => setTyped(e.target.value)}
                     placeholder={typedPlaceholder(
                        courseStyle,
                        question.direction,
                     )}
                     // biome-ignore lint/a11y/noAutofocus: поле появляется по ходу теста, фокус ожидаем
                     autoFocus
                     className="input"
                  />
                  <button
                     type="submit"
                     disabled={pending || typed.trim() === ""}
                     className="btn btn--primary btn--block"
                  >
                     Ответить
                  </button>
               </form>
            )}
         </div>
      </div>
   );
}
