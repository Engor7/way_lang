"use server";

import { and, eq } from "drizzle-orm";
import {
   checkChoiceAnswer,
   checkTypedAnswer,
   checkVerbAnswer,
   expectedAnswer,
   getCourse,
   getItem,
   verbExpected,
} from "@/content";
import type { Direction, QuestionKind } from "@/content/types";
import type { VerbVariant } from "@/content/verbs-course";
import { db } from "@/db";
import { itemProgress } from "@/db/schema";
import { applyAnswer, NEW_ITEM, type ProgressState } from "@/lib/mastery";
import { recordAnswers } from "@/lib/stats";
import { requireUser } from "@/lib/user-auth";

export type TrainingAnswer = {
   courseId: string;
   itemId: string;
   kind: QuestionKind;
   direction: Direction;
   // текст ответа; для флеш-карточки — "knew" | "forgot"
   answer: string;
   // курс verbs: вариант вопроса (перевод / формы / пропуск в примере)
   variant?: VerbVariant;
   exampleIndex?: number;
};

export type TrainingResult = {
   correct: boolean;
   expected: string;
   stage: number;
};

export async function submitTrainingAnswer(
   input: TrainingAnswer,
): Promise<TrainingResult> {
   const user = await requireUser();
   const course = getCourse(input.courseId);
   const item = course ? getItem(course, input.itemId) : null;
   if (!course || !item) {
      throw new Error("Unknown course or item");
   }

   const verbCtx =
      course.id === "verbs" && input.kind !== "flashcard"
         ? {
              kind: input.kind,
              variant: input.variant,
              exampleIndex: input.exampleIndex,
           }
         : null;

   let correct: boolean;
   if (input.kind === "flashcard") {
      correct = input.answer === "knew";
   } else if (verbCtx) {
      correct = checkVerbAnswer(item, verbCtx, input.answer);
   } else if (input.kind === "choice") {
      correct = checkChoiceAnswer(course, item, input.direction, input.answer);
   } else {
      correct = checkTypedAnswer(course, item, input.direction, input.answer);
   }

   const [row] = await db
      .select()
      .from(itemProgress)
      .where(
         and(
            eq(itemProgress.userId, user.id),
            eq(itemProgress.courseId, course.id),
            eq(itemProgress.itemId, item.id),
         ),
      )
      .limit(1);

   const state: ProgressState = row ?? NEW_ITEM;
   const next = applyAnswer(state, correct);
   await db
      .insert(itemProgress)
      .values({
         userId: user.id,
         courseId: course.id,
         itemId: item.id,
         ...next,
         updatedAt: new Date(),
      })
      .onConflictDoUpdate({
         target: [
            itemProgress.userId,
            itemProgress.courseId,
            itemProgress.itemId,
         ],
         set: { ...next, updatedAt: new Date() },
      });
   await recordAnswers(user.id, 1, correct ? 1 : 0);

   return {
      correct,
      expected: verbCtx
         ? verbExpected(item, verbCtx)
         : expectedAnswer(course, item, input.direction),
      stage: next.stage,
   };
}
