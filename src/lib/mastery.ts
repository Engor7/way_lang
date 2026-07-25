// Модель освоения элемента и сборка тренировочной сессии. Чистые функции —
// server actions читают/пишут БД, вся логика переходов здесь.
//
// Стадии: 0 флеш-карточка → 1 выбор из вариантов → 2 ввод текста → 3 выучено.
// Переход вверх — 2 правильных подряд (с флеш-карточки — сразу после «знал»),
// ошибка на вводе опускает обратно на выбор, ошибка на выученном — на ввод.

import {
   allItems,
   buildChoiceOptions,
   enSide,
   questionPrompt,
   shuffle,
   verbTranslationOptions,
} from "@/content";
import type { Course, Direction, Item, QuestionKind } from "@/content/types";
import {
   splitExample,
   type VerbVariant,
   verbEntryOf,
} from "@/content/verbs-course";

export const STAGE_FLASHCARD = 0;
export const STAGE_CHOICE = 1;
export const STAGE_TYPED = 2;
export const STAGE_LEARNED = 3;

const STREAK_TO_ADVANCE = 2;

export type ProgressState = {
   stage: number;
   streak: number;
   correct: number;
   wrong: number;
   learnedAt: Date | null;
};

export const NEW_ITEM: ProgressState = {
   stage: STAGE_FLASHCARD,
   streak: 0,
   correct: 0,
   wrong: 0,
   learnedAt: null,
};

export function applyAnswer(
   state: ProgressState,
   isCorrect: boolean,
): ProgressState {
   const counted = {
      ...state,
      correct: state.correct + (isCorrect ? 1 : 0),
      wrong: state.wrong + (isCorrect ? 0 : 1),
   };
   if (!isCorrect) {
      if (state.stage === STAGE_TYPED) {
         return { ...counted, stage: STAGE_CHOICE, streak: 0 };
      }
      if (state.stage === STAGE_LEARNED) {
         return { ...counted, stage: STAGE_TYPED, streak: 0 };
      }
      return { ...counted, streak: 0 };
   }
   if (state.stage === STAGE_FLASHCARD) {
      return { ...counted, stage: STAGE_CHOICE, streak: 0 };
   }
   if (state.stage === STAGE_LEARNED) {
      return counted;
   }
   const streak = state.streak + 1;
   if (streak >= STREAK_TO_ADVANCE) {
      const stage = state.stage + 1;
      return {
         ...counted,
         stage,
         streak: 0,
         learnedAt:
            stage === STAGE_LEARNED
               ? (state.learnedAt ?? new Date())
               : state.learnedAt,
      };
   }
   return { ...counted, streak };
}

// Строка прогресса из БД (подмножество колонок item_progress)
export type ProgressRow = ProgressState & {
   itemId: string;
   updatedAt: Date;
};

export type SessionQuestion = {
   itemId: string;
   kind: QuestionKind;
   direction: Direction;
   prompt: string;
   hint?: string;
   options?: string[]; // для choice
   back?: string; // обратная сторона флеш-карточки
   promptEn?: string; // prompt — английский: озвучить при показе вопроса
   backEn?: string; // английский «на обороте»: озвучить при флипе / в фидбеке
   // курс verbs: вариант вопроса и его данные
   variant?: VerbVariant;
   exampleIndex?: number; // для варианта gap
   placeholder?: string; // подпись поля ввода
   task?: string; // что требуется сделать («Выбери 2-ю и 3-ю формы»)
   // контекст под вопросом: примеры-подсказки (для forms — с пропусками,
   // чтобы было видно, куда встают формы; note — перевод)
   context?: { text: string; note?: string }[];
};

const SESSION_SIZE = 10;
const MAX_REVIEW = 6; // элементов «в процессе» за сессию
const LEARNED_REVIEW = 2; // выученных на повтор за сессию

function pickOne<T>(values: T[]): T {
   return values[Math.floor(Math.random() * values.length)];
}

// Вопросы курса «Три формы глагола» — своя система: карточка-«урок» с формами
// и примерами, затем вперемешку перевод (в обе стороны), формы и «вставь
// форму» по примерам. direction всегда "from-en", реальный смысл несёт variant.
function verbQuestion(
   course: Course,
   item: Item,
   stage: number,
): SessionQuestion {
   const entry = verbEntryOf(item.id);
   if (!entry) {
      throw new Error(`verbQuestion: unknown verb item ${item.id}`);
   }
   const forms = item.answer;
   const common = { itemId: item.id, direction: "from-en" as Direction };
   // подсказки-примеры: для forms — прошедшее и перфект с пропусками
   // (видно, куда встают 2-я и 3-я формы), для перевода — пример-контекст
   const formsContext = entry.examples.slice(1).map((example) => ({
      text: splitExample(example.en).gapped,
      note: example.ru,
   }));

   if (stage === STAGE_FLASHCARD) {
      return {
         ...common,
         kind: "flashcard",
         prompt: entry.base,
         back: forms,
         promptEn: entry.base,
         backEn: forms,
         task: "Знаешь этот глагол и его формы?",
      };
   }

   if (stage === STAGE_CHOICE) {
      const variant = pickOne<VerbVariant>(["en-ru", "ru-en", "forms"]);
      if (variant === "en-ru") {
         return {
            ...common,
            kind: "choice",
            variant,
            prompt: entry.base,
            promptEn: entry.base,
            task: "Что значит этот глагол?",
            // английский пример как контекст значения (перевода не выдаёт)
            context: [{ text: splitExample(entry.examples[0].en).clean }],
            options: verbTranslationOptions(course, item, "en-ru"),
         };
      }
      if (variant === "ru-en") {
         return {
            ...common,
            kind: "choice",
            variant,
            prompt: entry.ru,
            task: "Какой это глагол по-английски?",
            // русский пример как контекст (английский выдал бы ответ)
            context: [{ text: entry.examples[0].ru }],
            options: verbTranslationOptions(course, item, "ru-en"),
            backEn: entry.base,
         };
      }
      return {
         ...common,
         kind: "choice",
         variant,
         prompt: entry.base,
         hint: entry.ru,
         promptEn: entry.base,
         task: "Выбери 2-ю и 3-ю формы — те, что встают в пропуски",
         context: formsContext,
         options: buildChoiceOptions(course, item, "from-en"),
         backEn: forms,
      };
   }

   const variant = pickOne<VerbVariant>(["ru-en", "forms", "gap"]);
   if (variant === "gap") {
      const exampleIndex = Math.floor(Math.random() * entry.examples.length);
      const example = entry.examples[exampleIndex];
      const { gapped, clean } = splitExample(example.en);
      return {
         ...common,
         kind: "typed",
         variant,
         exampleIndex,
         prompt: gapped,
         hint: example.ru,
         task: `Вставь «${entry.base}» в нужной форме`,
         placeholder: "Глагол в нужной форме",
         backEn: clean,
      };
   }
   if (variant === "ru-en") {
      return {
         ...common,
         kind: "typed",
         variant,
         prompt: entry.ru,
         task: "Напиши этот глагол по-английски",
         context: [{ text: entry.examples[0].ru }],
         placeholder: "Ответ по-английски",
         backEn: entry.base,
      };
   }
   return {
      ...common,
      kind: "typed",
      variant,
      prompt: entry.base,
      hint: entry.ru,
      promptEn: entry.base,
      task: "Напиши 2-ю и 3-ю формы — те, что встают в пропуски",
      context: formsContext,
      placeholder: "Вторая и третья формы",
      backEn: forms,
   };
}

function questionForStage(
   course: Course,
   item: Item,
   stage: number,
): SessionQuestion {
   if (course.id === "verbs") {
      return verbQuestion(course, item, stage);
   }
   // Что озвучивать. Показ цифр — тот же английский контент («42» звучит как
   // "forty-two"), поэтому у чисел prompt озвучиваем всегда. У слов русский
   // prompt (to-en) молчит — озвучка выдала бы ответ перевода.
   const speakPrompt = (direction: Direction) =>
      course.id === "numbers" || direction === "from-en"
         ? enSide(course, item)
         : undefined;

   if (stage === STAGE_FLASHCARD) {
      const en = enSide(course, item);
      return {
         itemId: item.id,
         kind: "flashcard",
         direction: "to-en",
         prompt: item.prompt,
         hint: item.hint,
         back: item.answer,
         promptEn: en,
         backEn: en === item.answer ? en : undefined,
      };
   }
   if (stage === STAGE_CHOICE) {
      // числа: всегда цифры → слова; слова: случайное направление
      const direction: Direction =
         course.id === "numbers" || Math.random() < 0.5 ? "to-en" : "from-en";
      return {
         itemId: item.id,
         kind: "choice",
         direction,
         prompt: questionPrompt(course, item, direction),
         hint: item.hint,
         options: buildChoiceOptions(course, item, direction),
         promptEn: speakPrompt(direction),
         backEn: direction === "to-en" ? enSide(course, item) : undefined,
      };
   }
   // ввод: числа — в обе стороны случайно, слова — только RU→EN
   const direction: Direction =
      course.id === "numbers" && Math.random() < 0.5 ? "from-en" : "to-en";
   return {
      itemId: item.id,
      kind: "typed",
      direction,
      prompt: questionPrompt(course, item, direction),
      hint: item.hint,
      promptEn: speakPrompt(direction),
      backEn: direction === "to-en" ? enSide(course, item) : undefined,
   };
}

// Сессия: сперва элементы «в процессе» (давно не тренированные — первыми),
// затем новые в порядке уровней, и 1–2 выученных на повтор.
export function buildSession(
   course: Course,
   rows: ProgressRow[],
   size = SESSION_SIZE,
): SessionQuestion[] {
   const byItem = new Map(rows.map((row) => [row.itemId, row]));
   const questions: SessionQuestion[] = [];

   const inProgress = rows
      .filter((row) => row.stage === STAGE_CHOICE || row.stage === STAGE_TYPED)
      .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
      .slice(0, MAX_REVIEW);
   for (const row of inProgress) {
      const item = allItems(course).find((it) => it.id === row.itemId);
      if (item) {
         questions.push(questionForStage(course, item, row.stage));
      }
   }

   // повтор выученных: резервируем под него место, иначе новые элементы
   // всегда заполнят сессию целиком
   const learned = shuffle(
      rows.filter((row) => row.stage === STAGE_LEARNED),
   ).slice(0, LEARNED_REVIEW);

   // новые и «не знал» на флеш-карточках — строго в порядке уровней
   for (const item of allItems(course)) {
      if (questions.length >= size - learned.length) {
         break;
      }
      const row = byItem.get(item.id);
      if (!row || row.stage === STAGE_FLASHCARD) {
         questions.push(questionForStage(course, item, STAGE_FLASHCARD));
      }
   }

   for (const row of learned) {
      if (questions.length >= size) {
         break;
      }
      const item = allItems(course).find((it) => it.id === row.itemId);
      if (item) {
         questions.push(questionForStage(course, item, STAGE_TYPED));
      }
   }

   return questions.slice(0, size);
}

export type CourseSummary = {
   total: number;
   learned: number;
   inProgress: number;
   remaining: number;
};

export function summarize(course: Course, rows: ProgressRow[]): CourseSummary {
   const total = allItems(course).length;
   const known = new Set(allItems(course).map((item) => item.id));
   const relevant = rows.filter((row) => known.has(row.itemId));
   const learned = relevant.filter((row) => row.stage === STAGE_LEARNED).length;
   const inProgress = relevant.length - learned;
   return {
      total,
      learned,
      inProgress,
      remaining: total - learned - inProgress,
   };
}

export type LevelSummary = {
   levelId: string;
   title: string;
   total: number;
   learned: number;
};

export function levelBreakdown(
   course: Course,
   rows: ProgressRow[],
): LevelSummary[] {
   const learnedIds = new Set(
      rows
         .filter((row) => row.stage === STAGE_LEARNED)
         .map((row) => row.itemId),
   );
   return course.levels.map((level) => ({
      levelId: level.id,
      title: level.title,
      total: level.items.length,
      learned: level.items.filter((item) => learnedIds.has(item.id)).length,
   }));
}
