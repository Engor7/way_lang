// Сборка тематических курсов из morewords.txt.
//
// morewords.txt — источник правды: `## Колода` становится курсом,
// `### Группа` внутри неё — уровнем, строка `english — русский` — карточкой.
// Метаданные курсов (id, раздел, описание) лежат в scripts/vocab-decks.ts.
// Результат — src/content/vocab.json, его подхватывает vocab-courses.ts.
//
// Запуск: pnpm vocab:build

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Course, Item, Level } from "../src/content/types";
import { DECKS } from "./vocab-decks";

const SOURCE = path.join(import.meta.dirname, "..", "morewords.txt");
const OUTPUT = path.join(
   import.meta.dirname,
   "..",
   "src",
   "content",
   "vocab.json",
);

// Уровень длиннее этого режется на куски по CHUNK — иначе «уровень» из 70
// слов не даёт никакого ощущения продвижения.
const MAX_LEVEL = 30;
const CHUNK = 25;
// Этапов супер-теста: примерно по 30 вопросов на этап, но в разумных рамках.
const PER_STAGE = 30;
const MIN_STAGES = 2;
const MAX_STAGES = 5;

type RawEntry = { en: string; ru: string };
type RawGroup = { title: string | null; entries: RawEntry[] };
type RawDeck = { title: string; groups: RawGroup[] };

function parse(text: string): RawDeck[] {
   const decks: RawDeck[] = [];
   for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
         decks.push({ title: trimmed.slice(3).trim(), groups: [] });
         continue;
      }
      const deck = decks[decks.length - 1];
      if (!deck) {
         continue; // шапка файла до первой колоды
      }
      if (trimmed.startsWith("### ")) {
         deck.groups.push({ title: trimmed.slice(4).trim(), entries: [] });
         continue;
      }
      const separator = trimmed.indexOf(" — ");
      if (separator === -1) {
         continue;
      }
      // карточки до первого `###` живут в безымянной группе
      if (deck.groups.length === 0) {
         deck.groups.push({ title: null, entries: [] });
      }
      deck.groups[deck.groups.length - 1].entries.push({
         en: trimmed.slice(0, separator).trim(),
         ru: trimmed.slice(separator + 3).trim(),
      });
   }
   return decks;
}

function slug(text: string): string {
   const ascii = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
   return ascii || "x";
}

// Уровни курса: группы `###` как есть, длинные — на равные куски (не «25 и
// хвост из 7», а два по 16). id уровня — просто порядковый номер: заголовки
// русские, слаг из них не сделать.
function buildLevels(deck: RawDeck, itemsOf: (g: RawGroup) => Item[]): Level[] {
   const levels: Level[] = [];
   const push = (title: string, items: Item[]) =>
      levels.push({ id: `l${levels.length + 1}`, title, items });

   for (const group of deck.groups) {
      const items = itemsOf(group);
      if (items.length === 0) {
         continue;
      }
      if (items.length <= MAX_LEVEL) {
         push(group.title ?? "Слова", items);
         continue;
      }
      const parts = Math.ceil(items.length / CHUNK);
      const size = Math.ceil(items.length / parts);
      for (let start = 0; start < items.length; start += size) {
         const chunk = items.slice(start, start + size);
         const range = `${start + 1}–${start + chunk.length}`;
         push(
            group.title === null
               ? `Слова ${range}`
               : `${group.title} · ${range}`,
            chunk,
         );
      }
   }
   return levels;
}

function main() {
   const decks = parse(readFileSync(SOURCE, "utf8"));
   const courses: Course[] = [];
   const usedIds = new Set<string>();
   const warnings: string[] = [];
   const duplicates: string[] = [];

   for (const deck of decks) {
      const meta = DECKS[deck.title];
      if (!meta) {
         throw new Error(
            `Колода «${deck.title}» не описана в scripts/vocab-decks.ts — ` +
               `добавьте туда id, раздел и описание.`,
         );
      }
      if (usedIds.has(meta.id)) {
         throw new Error(`Дубль id курса: ${meta.id}`);
      }
      usedIds.add(meta.id);

      const englishOf = (entry: RawEntry) => (meta.swap ? entry.ru : entry.en);

      // Одно и то же английское слово внутри колоды (you «ты» и you «тебя»)
      // получает подсказкой название своей группы — иначе вопрос без ответа.
      const enCount = new Map<string, number>();
      for (const group of deck.groups) {
         for (const entry of group.entries) {
            const en = englishOf(entry);
            enCount.set(en, (enCount.get(en) ?? 0) + 1);
         }
      }

      // Полный дубль карточки внутри колоды («his — его» в притяжательных
      // и в самостоятельных) — это одна и та же карточка дважды.
      const seenPairs = new Set<string>();
      const takenItemIds = new Set<string>();
      const itemsOf = (group: RawGroup): Item[] =>
         group.entries.flatMap((entry) => {
            const en = englishOf(entry);
            const ru = meta.swap ? entry.en : entry.ru;
            if (seenPairs.has(`${en} ${ru}`)) {
               duplicates.push(`${meta.id}: ${en} — ${ru}`);
               return [];
            }
            seenPairs.add(`${en} ${ru}`);
            let id = `w:${slug(en)}`;
            for (let n = 2; takenItemIds.has(id); n++) {
               id = `w:${slug(en)}-${n}`;
            }
            takenItemIds.add(id);
            const ambiguous = (enCount.get(en) ?? 0) > 1;
            return {
               id,
               prompt: en,
               answer: ru,
               ...(ambiguous && group.title ? { hint: group.title } : {}),
            };
         });

      const levels = buildLevels(deck, itemsOf);
      const total = levels.reduce((sum, level) => sum + level.items.length, 0);

      // Одинаковый перевод у разных слов курса делает «выбор» неоднозначным
      // (два верных варианта) — сообщаем, чтобы можно было поправить словарь.
      const byRu = new Map<string, string[]>();
      for (const level of levels) {
         for (const item of level.items) {
            byRu.set(item.answer, [
               ...(byRu.get(item.answer) ?? []),
               item.prompt,
            ]);
         }
      }
      for (const [ru, words] of byRu) {
         if (words.length > 1) {
            warnings.push(`${meta.id}: «${ru}» — ${words.join(", ")}`);
         }
      }

      courses.push({
         id: meta.id,
         title: deck.title,
         description: meta.description,
         group: meta.group,
         style: "words",
         examStages: Math.min(
            MAX_STAGES,
            Math.max(MIN_STAGES, Math.ceil(total / PER_STAGE)),
         ),
         levels,
      });
   }

   writeFileSync(OUTPUT, `${JSON.stringify(courses, null, 3)}\n`);

   const items = courses.reduce(
      (sum, course) =>
         sum + course.levels.reduce((n, level) => n + level.items.length, 0),
      0,
   );
   console.log(`Курсов: ${courses.length}, карточек: ${items}`);
   if (duplicates.length > 0) {
      console.log(`\nСхлопнуты полные дубли (${duplicates.length}):`);
      for (const duplicate of duplicates) {
         console.log(`  ${duplicate}`);
      }
   }
   if (warnings.length > 0) {
      console.log(
         `\nОдинаковый перевод у разных слов (${warnings.length}) — ` +
            `в вопросах «выбери слово по переводу» такие пары не встретятся ` +
            `друг с другом, но словарь стоит уточнить:`,
      );
      for (const warning of warnings) {
         console.log(`  ${warning}`);
      }
   }
}

main();
