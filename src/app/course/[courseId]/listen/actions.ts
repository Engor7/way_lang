"use server";

import { enSide, expectedAnswer, getCourse, getItem } from "@/content";
import { checkListeningAnswer, type ListeningKind } from "@/lib/listening";
import { recordAnswers } from "@/lib/stats";
import { requireUser } from "@/lib/user-auth";

export type ListeningAnswer = {
   courseId: string;
   itemId: string;
   kind: ListeningKind;
   answer: string;
};

export type ListeningResult = {
   correct: boolean;
   textEn: string; // что звучало
   translation: string; // «родная» сторона: цифры / перевод
};

// Аудирование не трогает item_progress — пишем только дневную статистику
export async function submitListeningAnswer(
   input: ListeningAnswer,
): Promise<ListeningResult> {
   const user = await requireUser();
   const course = getCourse(input.courseId);
   const item = course ? getItem(course, input.itemId) : null;
   if (!course || !item) {
      throw new Error("Unknown course or item");
   }

   const correct = checkListeningAnswer(course, item, input.kind, input.answer);
   await recordAnswers(user.id, 1, correct ? 1 : 0);

   return {
      correct,
      textEn: enSide(course, item),
      // у глаголов «переводная» сторона — русский перевод (варианты выбора),
      // у остальных курсов — родная сторона элемента
      translation:
         course.id === "verbs"
            ? (item.hint ?? "")
            : expectedAnswer(course, item, "from-en"),
   };
}
