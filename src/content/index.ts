// Доступ к учебному контенту: курсы, элементы, формирование вопросов
// и проверка ответов. Единственная точка входа для остального кода.

import { checkDigits, checkEnglishNumber, normalize } from "./number-words";
import { numbersCourse } from "./numbers-course";
import { top100Course } from "./top100-course";
import type {
   Course,
   CourseId,
   Direction,
   Item,
   Level,
   QuestionKind,
} from "./types";
import {
   checkVerbForms,
   checkVerbGap,
   splitExample,
   type VerbExample,
   type VerbVariant,
   verbEntryOf,
   verbFormsDistractors,
   verbsCourse,
} from "./verbs-course";

const COURSES: Course[] = [numbersCourse, top100Course, verbsCourse];

const itemMaps = new Map<CourseId, Map<string, Item>>();
for (const course of COURSES) {
   const map = new Map<string, Item>();
   for (const level of course.levels) {
      for (const item of level.items) {
         map.set(item.id, item);
      }
   }
   itemMaps.set(course.id, map);
}

export function listCourses(): Course[] {
   return COURSES;
}

export function getCourse(id: string): Course | null {
   return COURSES.find((course) => course.id === id) ?? null;
}

export function getItem(course: Course, itemId: string): Item | null {
   return itemMaps.get(course.id)?.get(itemId) ?? null;
}

export function allItems(course: Course): Item[] {
   return course.levels.flatMap((level) => level.items);
}

export function courseItemCount(course: Course): number {
   return allItems(course).length;
}

export function levelOfItem(course: Course, itemId: string): Level | null {
   return (
      course.levels.find((level) =>
         level.items.some((item) => item.id === itemId),
      ) ?? null
   );
}

// «Английская» сторона элемента: у чисел это answer (words),
// у слов — prompt (само слово).
export function enSide(course: Course, item: Item): string {
   return course.id === "numbers" ? item.answer : item.prompt;
}

// «Родная» сторона: цифры у чисел, русский перевод у слов.
function nativeSide(course: Course, item: Item): string {
   return course.id === "numbers" ? item.prompt : item.answer;
}

// Что показываем пользователю в вопросе
export function questionPrompt(
   course: Course,
   item: Item,
   direction: Direction,
): string {
   return direction === "to-en"
      ? nativeSide(course, item)
      : enSide(course, item);
}

// Правильный ответ в том виде, в котором его показываем / сравниваем в MC
export function expectedAnswer(
   course: Course,
   item: Item,
   direction: Direction,
): string {
   return direction === "to-en"
      ? enSide(course, item)
      : nativeSide(course, item);
}

export function parseNumberItem(itemId: string): {
   value: number;
   ordinal: boolean;
} {
   const [kind, raw] = itemId.split(":");
   return { value: Number(raw), ordinal: kind === "ord" };
}

// Проверка свободного ввода
export function checkTypedAnswer(
   course: Course,
   item: Item,
   direction: Direction,
   input: string,
): boolean {
   if (course.id === "numbers") {
      const { value, ordinal } = parseNumberItem(item.id);
      if (direction === "to-en") {
         // «21-й» → допускаем и порядковое, и на всякий случай точное словами
         return checkEnglishNumber(value, input, ordinal);
      }
      return checkDigits(value, input);
   }
   if (course.id === "verbs") {
      // глаголы без варианта (экзамен): ввод форм по базе
      return checkVerbForms(item.answer, input);
   }
   // top100: свободный ввод только RU→EN
   return normalize(input) === normalize(item.prompt);
}

// Плейсхолдер поля свободного ввода — зависит от курса и направления
export function typedPlaceholder(
   courseId: CourseId,
   direction: Direction,
): string {
   if (courseId === "verbs") {
      return "Вторая и третья формы";
   }
   return direction === "to-en" ? "Ответ по-английски" : "Ответ цифрами";
}

// ——— Вопросы по глаголам: варианты «перевод / формы / пропуск в примере» ———

export type VerbAnswerContext = {
   kind: QuestionKind;
   variant?: VerbVariant;
   exampleIndex?: number;
};

function verbExampleAt(
   entry: NonNullable<ReturnType<typeof verbEntryOf>>,
   index: number | undefined,
): VerbExample {
   const i = Math.min(Math.max(index ?? 0, 0), entry.examples.length - 1);
   return entry.examples[i];
}

export function checkVerbAnswer(
   item: Item,
   ctx: VerbAnswerContext,
   input: string,
): boolean {
   const entry = verbEntryOf(item.id);
   if (!entry) {
      return false;
   }
   const variant = ctx.variant ?? "forms";
   if (variant === "gap") {
      return checkVerbGap(verbExampleAt(entry, ctx.exampleIndex), input);
   }
   if (variant === "en-ru") {
      return input === entry.ru;
   }
   if (variant === "ru-en") {
      return ctx.kind === "typed"
         ? normalize(input) === normalize(entry.base)
         : input === entry.base;
   }
   return ctx.kind === "typed"
      ? checkVerbForms(item.answer, input)
      : input === item.answer;
}

// Правильный ответ для показа в фидбеке (и подсветки варианта в выборе)
export function verbExpected(item: Item, ctx: VerbAnswerContext): string {
   const entry = verbEntryOf(item.id);
   if (!entry) {
      return item.answer;
   }
   const variant = ctx.variant ?? "forms";
   if (variant === "gap") {
      return splitExample(verbExampleAt(entry, ctx.exampleIndex).en).clean;
   }
   if (variant === "en-ru") {
      return entry.ru;
   }
   if (variant === "ru-en") {
      return entry.base;
   }
   return item.answer;
}

// 4 варианта для «глагол → перевод» (en-ru) и «перевод → глагол» (ru-en):
// дистракторы — переводы/базы других глаголов уровня, добор из курса
export function verbTranslationOptions(
   course: Course,
   item: Item,
   variant: "en-ru" | "ru-en",
): string[] {
   const project = (candidate: Item) =>
      variant === "en-ru" ? (candidate.hint ?? "") : candidate.prompt;
   const correct = project(item);
   const level = levelOfItem(course, item.id);
   const pool = [
      ...shuffle((level?.items ?? []).map(project)),
      ...shuffle(allItems(course).map(project)),
   ];
   const distractors: string[] = [];
   for (const option of unique(pool)) {
      if (
         option !== correct &&
         option !== "" &&
         !distractors.includes(option)
      ) {
         distractors.push(option);
      }
      if (distractors.length === 3) {
         break;
      }
   }
   return shuffle([correct, ...distractors]);
}

// Проверка ответа в multiple choice (сравнение с показанным вариантом)
export function checkChoiceAnswer(
   course: Course,
   item: Item,
   direction: Direction,
   input: string,
): boolean {
   return input === expectedAnswer(course, item, direction);
}

// 4 варианта для multiple choice: правильный + 3 дистрактора из того же
// уровня (добор из всего курса), перемешаны.
export function buildChoiceOptions(
   course: Course,
   item: Item,
   direction: Direction,
): string[] {
   // глаголы: дистракторы — испорченные формы этого же глагола
   if (course.id === "verbs") {
      const entry = verbEntryOf(item.id);
      if (entry) {
         const wrong = shuffle(verbFormsDistractors(entry)).slice(0, 3);
         return shuffle([item.answer, ...wrong]);
      }
   }
   const correct = expectedAnswer(course, item, direction);
   const level = levelOfItem(course, item.id);
   const toOptions = (items: Item[]) =>
      items
         .filter((candidate) => candidate.id !== item.id)
         .map((candidate) => expectedAnswer(course, candidate, direction));
   // сначала соседи по уровню (похожие по сложности), затем добор из курса
   const pool = [
      ...shuffle(toOptions(level?.items ?? [])),
      ...shuffle(toOptions(allItems(course))),
   ];
   const distractors: string[] = [];
   for (const option of unique(pool)) {
      if (option !== correct && !distractors.includes(option)) {
         distractors.push(option);
      }
      if (distractors.length === 3) {
         break;
      }
   }
   return shuffle([correct, ...distractors]);
}

function unique(values: string[]): string[] {
   return [...new Set(values)];
}

export function shuffle<T>(values: T[]): T[] {
   const out = [...values];
   for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
   }
   return out;
}
