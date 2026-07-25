"use client";

// Тренажёр: очередь вопросов сессии. Флеш-карточка с переворотом,
// выбор из 4 вариантов, ввод текста. Ответы отправляются server action'ом,
// прогресс обновляется на сервере; «не знал» на карточке повторяется
// в конце этой же сессии.

import { Check, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BackNav } from "@/components/back-nav";
import { Speakable } from "@/components/speakable";
import { typedPlaceholder } from "@/content";
import type { CourseId } from "@/content/types";
import {
   splitExample,
   type VerbCardData,
   verbCardOf,
} from "@/content/verbs-course";
import { speak, stopSpeech } from "@/lib/audio";
import type { SessionQuestion } from "@/lib/mastery";
import styles from "../course.module.scss";
import { submitTrainingAnswer, type TrainingResult } from "./actions";

// метка этапа в шапке; у «выбора» подписи нет
const STAGE_LABELS: Partial<Record<SessionQuestion["kind"], string>> = {
   flashcard: "карточка",
   typed: "ввод",
};

// озвучиваем только целые английские подсказки: русский перевод и предложения
// с пропуском («I ___ at home») звучали бы бессмысленно
function isSpeakableEn(text: string): boolean {
   return !text.includes("___") && !/[а-яё]/i.test(text);
}

type Props = {
   courseId: CourseId;
   questions: SessionQuestion[];
};

export function Trainer({ courseId, questions }: Props) {
   const [queue, setQueue] = useState(questions);
   const [index, setIndex] = useState(0);
   const [flipped, setFlipped] = useState(false);
   const [typed, setTyped] = useState("");
   const [chosen, setChosen] = useState<string | null>(null);
   const [result, setResult] = useState<TrainingResult | null>(null);
   const [stats, setStats] = useState({ correct: 0, wrong: 0 });
   const [pending, startTransition] = useTransition();

   const question = queue[index] as SessionQuestion | undefined;

   // английский prompt озвучиваем при показе вопроса; при уходе со страницы
   // обрываем звук
   const promptEn = question?.promptEn;
   useEffect(() => {
      if (promptEn) {
         speak(promptEn);
      }
   }, [promptEn]);
   useEffect(() => stopSpeech, []);

   function advance() {
      setFlipped(false);
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
         const res = await submitTrainingAnswer({
            courseId,
            itemId: question.itemId,
            kind: question.kind,
            direction: question.direction,
            answer,
            variant: question.variant,
            exampleIndex: question.exampleIndex,
         });
         setStats((s) => ({
            correct: s.correct + (res.correct ? 1 : 0),
            wrong: s.wrong + (res.correct ? 0 : 1),
         }));
         if (question.kind === "flashcard") {
            if (!res.correct) {
               // «не знал» — повторим карточку в конце сессии
               setQueue((q) => [...q, question]);
            }
            advance();
         } else {
            setResult(res);
            // озвучиваем правильный английский ответ (закрепление на слух)
            if (question.backEn) {
               speak(question.backEn);
            }
         }
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
                     href={`/course/${courseId}/train`}
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

   const progressLabel = `${Math.min(index + 1, queue.length)} / ${queue.length}`;
   // разбор глагола: оборот флеш-карточки и объяснение после каждого ответа
   const verbCard = courseId === "verbs" ? verbCardOf(question.itemId) : null;

   return (
      <div className={styles.trainer}>
         <div className={styles.trainerTop}>
            <BackNav backHref={`/course/${courseId}`} />
            <div className={styles.trainerMeta}>
               <span>{progressLabel}</span>
               <span>{STAGE_LABELS[question.kind]}</span>
            </div>
         </div>

         <div className={styles.body}>
            <div className={styles.questionWrap}>
               {question.task && <p className={styles.task}>{question.task}</p>}
               <p
                  className={`question-accent ${styles.question} ${
                     // длинные вопросы (предложение с пропуском) — мельче
                     question.prompt.length > 24 ? styles.questionLong : ""
                  }`}
               >
                  {question.promptEn ? (
                     <Speakable text={question.promptEn}>
                        {question.prompt}
                     </Speakable>
                  ) : (
                     question.prompt
                  )}
               </p>
               {question.hint && <p className={styles.hint}>{question.hint}</p>}
               {question.context && result === null && (
                  <div className={styles.contextBlock}>
                     {question.context.map((line) => (
                        <p key={line.text} className={styles.contextLine}>
                           {isSpeakableEn(line.text) ? (
                              <Speakable text={line.text} />
                           ) : (
                              <span>{line.text}</span>
                           )}
                           {line.note && (
                              <span className={styles.contextNote}>
                                 {line.note}
                              </span>
                           )}
                        </p>
                     ))}
                  </div>
               )}
            </div>

            {question.kind === "flashcard" &&
               (flipped ? (
                  <div className={styles.flashcardBlock}>
                     {verbCard ? (
                        <VerbCardBack card={verbCard} />
                     ) : (
                        <p className={styles.cardBack}>
                           {question.backEn ? (
                              <Speakable text={question.backEn}>
                                 {question.back}
                              </Speakable>
                           ) : (
                              question.back
                           )}
                        </p>
                     )}
                     <div className={styles.pair}>
                        <button
                           type="button"
                           disabled={pending}
                           onClick={() => submit("forgot")}
                           className="btn btn--danger-outline"
                        >
                           <X size={16} />
                           Не знал
                        </button>
                        <button
                           type="button"
                           disabled={pending}
                           onClick={() => submit("knew")}
                           className="btn btn--success-outline"
                        >
                           <Check size={16} />
                           Знал
                        </button>
                     </div>
                  </div>
               ) : (
                  <button
                     type="button"
                     onClick={() => {
                        setFlipped(true);
                        // на «обороте» английский — сразу озвучиваем
                        if (question.backEn) {
                           speak(question.backEn);
                        }
                     }}
                     className="btn btn--outline btn--block"
                  >
                     Показать ответ
                  </button>
               ))}

            {question.kind === "choice" && (
               <div className={styles.options}>
                  {question.options?.map((option) => {
                     const isChosen = chosen === option;
                     const isCorrectOption =
                        result !== null && option === result.expected;
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

            {question.kind === "typed" && (
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
                     // не срабатывает при переходе «ввод → ввод»
                     key={index}
                     value={typed}
                     onChange={(e) => setTyped(e.target.value)}
                     placeholder={
                        question.placeholder ??
                        typedPlaceholder(courseId, question.direction)
                     }
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
                  {/* при ошибке — только правильный ответ, без подписей */}
                  {result !== null && !result.correct && (
                     <p className={styles.feedback}>
                        {question.backEn ? (
                           <Speakable
                              text={result.expected}
                              className={styles.strong}
                           />
                        ) : (
                           <span className={styles.strong}>
                              {result.expected}
                           </span>
                        )}
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

         {result !== null && question.kind !== "flashcard" && verbCard && (
            <div className={styles.verbExplain}>
               <VerbCardBack card={verbCard} />
            </div>
         )}

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

// Разбор глагола: перевод, затем каждая форма с подписью «когда используется»
// и примером с подсветкой формы; всё английское озвучивается по клику.
// Показывается на обороте флеш-карточки и после каждого ответа.
function VerbCardBack({ card }: { card: VerbCardData }) {
   return (
      <div className={styles.verbCard}>
         <p className={styles.verbForms}>
            <Speakable text={card.forms}>
               {card.base} — {card.forms}
            </Speakable>
         </p>
         <p className={styles.verbRu}>{card.ru}</p>
         <ul className={styles.verbExamples}>
            {card.rows.map((row) => {
               const parts = splitExample(row.en);
               return (
                  <li key={row.label} className={styles.verbExample}>
                     <span className={styles.verbTense}>
                        <b className={styles.verbFormMark}>{row.form}</b>
                        {" · "}
                        {row.label}
                     </span>
                     <Speakable text={parts.clean}>
                        {parts.before}
                        <b className={styles.verbFormMark}>{parts.form}</b>
                        {parts.after}
                     </Speakable>
                     <span className={styles.verbExampleRu}>{row.ru}</span>
                  </li>
               );
            })}
         </ul>
      </div>
   );
}
