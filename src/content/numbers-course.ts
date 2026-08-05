// Курс «Числа и числительные»: 0 → триллион + порядковые.
// Элементы — фиксированные детерминированные списки (стабильные id),
// английские ответы генерируются из number-words.ts, не пишутся руками.

import { numberToOrdinalWords, numberToWords } from "./number-words";
import type { Course, Item } from "./types";

const digitsFormat = new Intl.NumberFormat("ru-RU");

function cardinal(n: number): Item {
   return {
      id: `num:${n}`,
      prompt: digitsFormat.format(n),
      answer: numberToWords(n),
   };
}

function ordinal(n: number): Item {
   return {
      id: `ord:${n}`,
      prompt: `${digitsFormat.format(n)}-й`,
      answer: numberToOrdinalWords(n),
      hint: "порядковое",
   };
}

function range(from: number, to: number, step = 1): number[] {
   const out: number[] = [];
   for (let n = from; n <= to; n += step) {
      out.push(n);
   }
   return out;
}

export const numbersCourse: Course = {
   id: "numbers",
   title: "Числа и числительные",
   description: "От нуля до триллиона: количественные и порядковые",
   group: "Основа",
   style: "numbers",
   examStages: 4,
   levels: [
      {
         id: "basics",
         title: "Основа: 0–12",
         items: range(0, 12).map(cardinal),
      },
      {
         id: "teens",
         title: "13–19",
         items: range(13, 19).map(cardinal),
      },
      {
         id: "tens",
         title: "Десятки: 20–90",
         items: range(20, 90, 10).map(cardinal),
      },
      {
         id: "composite",
         title: "Составные: 21–99",
         items: [
            21, 25, 32, 34, 47, 53, 58, 61, 66, 74, 79, 82, 87, 95, 99,
         ].map(cardinal),
      },
      {
         id: "hundreds",
         title: "Сотни: 100–999",
         items: [
            100, 200, 300, 500, 700, 900, 101, 110, 115, 234, 305, 460, 578,
            999,
         ].map(cardinal),
      },
      {
         id: "thousands",
         title: "Тысячи: 1 000 – 999 999",
         items: [
            1000, 2000, 5000, 10000, 1001, 1100, 1500, 2024, 3750, 12300, 45678,
            100000, 250000, 999999,
         ].map(cardinal),
      },
      {
         id: "millions",
         title: "Миллионы и больше",
         items: [
            1000000, 2000000, 15000000, 100000000, 350000000, 1000000000,
            7500000000, 42000000000, 1000000000000, 2500001, 1234567,
            999999999999,
         ].map(cardinal),
      },
      {
         id: "ordinals",
         title: "Порядковые: first, second…",
         items: [
            1, 2, 3, 4, 5, 8, 9, 11, 12, 13, 20, 21, 22, 23, 30, 42, 100, 1000,
         ].map(ordinal),
      },
   ],
};
