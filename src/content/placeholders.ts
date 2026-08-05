// Подписи поля свободного ввода. Отдельный модуль без импортов контента:
// его тянут клиентские компоненты, а src/content/index.ts потащил бы
// за собой все курсы целиком.

import type { CourseStyle, Direction } from "./types";

export function typedPlaceholder(
   style: CourseStyle,
   direction: Direction,
): string {
   if (style === "verbs") {
      return "Вторая и третья формы";
   }
   if (style === "numbers") {
      return direction === "to-en" ? "Ответ по-английски" : "Ответ цифрами";
   }
   return "Ответ по-английски";
}
