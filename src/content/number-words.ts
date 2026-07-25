// Генерация английских числительных и проверка ответов. Чистые функции без
// зависимостей — используются и в контенте курса, и при оценке ответов.

const ONES = [
   "zero",
   "one",
   "two",
   "three",
   "four",
   "five",
   "six",
   "seven",
   "eight",
   "nine",
   "ten",
   "eleven",
   "twelve",
   "thirteen",
   "fourteen",
   "fifteen",
   "sixteen",
   "seventeen",
   "eighteen",
   "nineteen",
];

const TENS = [
   "",
   "",
   "twenty",
   "thirty",
   "forty",
   "fifty",
   "sixty",
   "seventy",
   "eighty",
   "ninety",
];

const SCALES = ["", "thousand", "million", "billion", "trillion"];

export const MAX_NUMBER = 1_000_000_000_000;

// 1..999 словами
function threeDigits(n: number): string {
   const parts: string[] = [];
   const hundreds = Math.floor(n / 100);
   const rest = n % 100;
   if (hundreds > 0) {
      parts.push(`${ONES[hundreds]} hundred`);
   }
   if (rest > 0) {
      if (rest < 20) {
         parts.push(ONES[rest]);
      } else {
         const ones = rest % 10;
         parts.push(
            ones > 0
               ? `${TENS[Math.floor(rest / 10)]}-${ONES[ones]}`
               : TENS[Math.floor(rest / 10)],
         );
      }
   }
   return parts.join(" ");
}

// Количественное числительное: 0..1 000 000 000 000
export function numberToWords(n: number): string {
   if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER) {
      throw new Error(`numberToWords: out of range: ${n}`);
   }
   if (n === 0) {
      return "zero";
   }
   const groups: string[] = [];
   let rest = n;
   let scale = 0;
   while (rest > 0) {
      const group = rest % 1000;
      if (group > 0) {
         const words = threeDigits(group);
         groups.unshift(scale > 0 ? `${words} ${SCALES[scale]}` : words);
      }
      rest = Math.floor(rest / 1000);
      scale += 1;
   }
   return groups.join(" ");
}

const ORDINAL_IRREGULAR: Record<string, string> = {
   one: "first",
   two: "second",
   three: "third",
   five: "fifth",
   eight: "eighth",
   nine: "ninth",
   twelve: "twelfth",
};

// Порядковое числительное: 1..1 000 000 000 000 (first, twenty-first, hundredth…)
export function numberToOrdinalWords(n: number): string {
   if (!Number.isInteger(n) || n < 1 || n > MAX_NUMBER) {
      throw new Error(`numberToOrdinalWords: out of range: ${n}`);
   }
   const words = numberToWords(n);
   const lastSpace = words.lastIndexOf(" ");
   const lastHyphen = words.lastIndexOf("-");
   const cut = Math.max(lastSpace, lastHyphen);
   const head = cut === -1 ? "" : words.slice(0, cut + 1);
   const last = cut === -1 ? words : words.slice(cut + 1);
   if (ORDINAL_IRREGULAR[last]) {
      return head + ORDINAL_IRREGULAR[last];
   }
   if (last.endsWith("y")) {
      return `${head}${last.slice(0, -1)}ieth`;
   }
   return `${head}${last}th`;
}

// Нормализация текстового ответа: регистр, дефисы, лишние пробелы,
// запятые и необязательное "and" (one hundred and one == one hundred one).
export function normalize(s: string): string {
   return s
      .toLowerCase()
      .replace(/[,.]/g, " ")
      .replace(/-/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 0 && word !== "and")
      .join(" ");
}

// Проверка английского числительного, введённого словами
export function checkEnglishNumber(
   n: number,
   input: string,
   ordinal = false,
): boolean {
   const expected = ordinal ? numberToOrdinalWords(n) : numberToWords(n);
   const got = normalize(input);
   if (got === normalize(expected)) {
      return true;
   }
   // "a hundred" / "a thousand" вместо "one hundred" / "one thousand"
   return got.replace(/\ba\b/g, "one") === normalize(expected);
}

// Проверка числа, введённого цифрами: "1 000 000", "1,000,000", "1000000"
export function checkDigits(n: number, input: string): boolean {
   const cleaned = input.replace(/[\s,._']/g, "");
   return /^\d+$/.test(cleaned) && Number(cleaned) === n;
}
