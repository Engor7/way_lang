// Сборка курса «500 полезных фраз» из текстового источника в корне репозитория.
//
// Источник — «500 полезных английских фраз.txt»: строка `**N. Тема (20 фраз)**`
// становится уровнем, строка `N. English – Русский` — карточкой.
// Результат — src/content/phrases.json, его подхватывает phrases-course.ts.
//
// Запуск: pnpm phrases:build

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { normalizeText } from "../src/content/text";
import type { Course, Item, Level } from "../src/content/types";

const SOURCE = path.join(
   import.meta.dirname,
   "..",
   "500 полезных английских фраз.txt",
);
const OUTPUT = path.join(
   import.meta.dirname,
   "..",
   "src",
   "content",
   "phrases.json",
);

const COURSE = {
   id: "phrases",
   title: "500 полезных фраз",
   description:
      "Готовые фразы на каждый день: от приветствий до аэропорта, врача и соцсетей",
   group: "Фразы",
   style: "words",
   examStages: 5,
} as const;

// `**3. Числа, время и даты (20 фраз)**` → «Числа, время и даты»
const SECTION = /^\*\*\s*\d+\.\s*(.+?)\s*(?:\(\s*\d+\s*фраз\w*\s*\))?\s*\*\*$/;
// `12. It’s nice to see you. – Приятно тебя видеть.`
const PHRASE = /^\d+\.\s*(.+)$/;
// Стороны разделяет тире; в одной строке источника вместо него дефис.
// Дефис поэтому берём только окружённый пробелами (внутри слов он свой:
// «check-in», «e-mail»), а тире — как есть, пробел перед ним не всегда стоит.
const SEPARATOR = /\s*–\s*/;
const SEPARATOR_FALLBACK = /\s+-\s+/;

type RawSection = { title: string; entries: { en: string; ru: string }[] };

function parse(text: string): RawSection[] {
   const sections: RawSection[] = [];
   for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed === "") {
         continue;
      }
      const heading = SECTION.exec(trimmed);
      if (heading) {
         sections.push({ title: heading[1], entries: [] });
         continue;
      }
      const phrase = PHRASE.exec(trimmed);
      const section = sections[sections.length - 1];
      if (!phrase || !section) {
         continue;
      }
      const parts = phrase[1].split(
         SEPARATOR.test(phrase[1]) ? SEPARATOR : SEPARATOR_FALLBACK,
      );
      if (parts.length < 2) {
         throw new Error(`Строка без разделителя сторон: «${trimmed}»`);
      }
      // Второе тире (если вдруг появится) остаётся русской стороне.
      section.entries.push({
         en: parts[0].trim(),
         ru: parts.slice(1).join(" – ").trim(),
      });
   }
   return sections;
}

function slug(text: string): string {
   const ascii = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
   return ascii || "x";
}

function main() {
   const sections = parse(readFileSync(SOURCE, "utf8"));

   // Темы в источнике повторяются («В магазине» — разделы 5 и 17): заголовок
   // уровня получает номер, иначе в списке уровней два одинаковых пункта.
   const titleCount = new Map<string, number>();
   for (const section of sections) {
      titleCount.set(section.title, (titleCount.get(section.title) ?? 0) + 1);
   }
   const titleSeen = new Map<string, number>();

   const levels: Level[] = [];
   const duplicates: string[] = [];
   // Темы 16–23 повторяют 4–9, поэтому одна и та же фраза встречается дважды —
   // иногда слово в слово, иногда с другим переводом («I don't feel well» —
   // «Мне плохо» и «Я плохо себя чувствую»). Карточка на фразу одна: два
   // одинаковых английских вопроса с разными «верными» ответами не разгадать.
   // Ключ — normalizeText, тот же, что и в сверке ввода: «See you soon.» и
   // «See you soon!» одинаковы и для пользователя, и для проверки ответа.
   const seen = new Map<string, string>(); // english → перевод первой карточки

   for (const section of sections) {
      const n = (titleSeen.get(section.title) ?? 0) + 1;
      titleSeen.set(section.title, n);
      const title =
         (titleCount.get(section.title) ?? 0) > 1
            ? `${section.title} · ${n}`
            : section.title;

      const items: Item[] = [];
      for (const entry of section.entries) {
         const key = normalizeText(entry.en);
         const kept = seen.get(key);
         if (kept !== undefined) {
            duplicates.push(
               kept === entry.ru
                  ? `${entry.en} — ${entry.ru}`
                  : `${entry.en} — ${entry.ru} (оставлен перевод «${kept}»)`,
            );
            continue;
         }
         seen.set(key, entry.ru);
         items.push({
            id: `p:${slug(entry.en)}`,
            prompt: entry.en,
            answer: entry.ru,
         });
      }
      if (items.length > 0) {
         levels.push({ id: `l${levels.length + 1}`, title, items });
      }
   }

   // Слаг режет пунктуацию, а она у фраз значимая («I’m sorry.» и «I’m
   // sorry?»): столкновение id молча склеило бы прогресс двух карточек.
   const ids = levels.flatMap((level) => level.items.map((item) => item.id));
   const collision = ids.find((id, i) => ids.indexOf(id) !== i);
   if (collision !== undefined) {
      throw new Error(`Две фразы дают одинаковый id ${collision}`);
   }

   const course: Course = { ...COURSE, levels };
   writeFileSync(OUTPUT, `${JSON.stringify(course, null, 3)}\n`);

   const total = levels.reduce((sum, level) => sum + level.items.length, 0);
   console.log(`Уровней: ${levels.length}, карточек: ${total}`);
   if (duplicates.length > 0) {
      console.log(`\nСхлопнуты полные дубли (${duplicates.length}):`);
      for (const duplicate of duplicates) {
         console.log(`  ${duplicate}`);
      }
   }

   // Одинаковый перевод у разных фраз делает «выбор» неоднозначным.
   const byRu = new Map<string, string[]>();
   for (const level of levels) {
      for (const item of level.items) {
         byRu.set(item.answer, [...(byRu.get(item.answer) ?? []), item.prompt]);
      }
   }
   const warnings = [...byRu].filter(([, phrases]) => phrases.length > 1);
   if (warnings.length > 0) {
      console.log(
         `\nОдинаковый перевод у разных фраз (${warnings.length}) — ` +
            `друг с другом в вариантах они не встретятся, но текст стоит уточнить:`,
      );
      for (const [ru, phrases] of warnings) {
         console.log(`  «${ru}» — ${phrases.join(", ")}`);
      }
   }
}

main();
