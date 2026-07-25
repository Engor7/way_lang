// Тренировка «Аудирование»: вопросы на слух. Чистые функции — сборка сессии
// и проверка ответов. На стадии освоения (item_progress) не влияет, пишется
// только дневная статистика.
//
// Пул сессии — элементы со стадии «выбор» и выше (слово уже знакомо);
// если таких нет — первый уровень курса. Вид вопроса: выбор перевода из 4
// или диктант (напечатать услышанное) — диктант только для стадии «ввод»+.

import {
   allItems,
   buildChoiceOptions,
   enSide,
   expectedAnswer,
   parseNumberItem,
   shuffle,
   verbTranslationOptions,
} from "@/content";
import {
   checkDigits,
   checkEnglishNumber,
   normalize,
} from "@/content/number-words";
import type { Course, Item } from "@/content/types";
import { type ProgressRow, STAGE_CHOICE, STAGE_TYPED } from "@/lib/mastery";

export type ListeningKind = "listening-choice" | "listening-typed";

export type ListeningQuestion = {
   itemId: string;
   kind: ListeningKind;
   text: string; // английский текст для озвучки; до ответа не показывается
   hint?: string;
   options?: string[]; // для choice: варианты «родной» стороны
};

const SESSION_SIZE = 10;

function listeningQuestion(
   course: Course,
   item: Item,
   kind: ListeningKind,
): ListeningQuestion {
   // глаголы: на слух проверяем значение — варианты-переводы;
   // подсказку-перевод при этом не показываем (она и есть ответ)
   const isVerbs = course.id === "verbs";
   return {
      itemId: item.id,
      kind,
      text: enSide(course, item),
      hint: isVerbs ? undefined : item.hint,
      options:
         kind === "listening-choice"
            ? isVerbs
               ? verbTranslationOptions(course, item, "en-ru")
               : buildChoiceOptions(course, item, "from-en")
            : undefined,
   };
}

export function buildListeningSession(
   course: Course,
   rows: ProgressRow[],
   size = SESSION_SIZE,
): ListeningQuestion[] {
   const byItem = new Map(rows.map((row) => [row.itemId, row]));
   const started = allItems(course).filter(
      (item) => (byItem.get(item.id)?.stage ?? 0) >= STAGE_CHOICE,
   );
   // новичку тоже даём тренировать слух — с первого уровня
   const pool = started.length > 0 ? started : (course.levels[0]?.items ?? []);

   return shuffle(pool)
      .slice(0, size)
      .map((item) => {
         const stage = byItem.get(item.id)?.stage ?? 0;
         // диктант — для тех, кто слово уже печатал
         const kind: ListeningKind =
            stage >= STAGE_TYPED && Math.random() < 0.5
               ? "listening-typed"
               : "listening-choice";
         return listeningQuestion(course, item, kind);
      });
}

export function checkListeningAnswer(
   course: Course,
   item: Item,
   kind: ListeningKind,
   input: string,
): boolean {
   if (kind === "listening-choice") {
      return course.id === "verbs"
         ? input === (item.hint ?? "")
         : input === expectedAnswer(course, item, "from-en");
   }
   // диктант: числа принимаем и словами, и цифрами
   if (course.id === "numbers") {
      const { value, ordinal } = parseNumberItem(item.id);
      return (
         checkEnglishNumber(value, input, ordinal) || checkDigits(value, input)
      );
   }
   return normalize(input) === normalize(item.prompt);
}
