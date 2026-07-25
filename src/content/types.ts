// Типы учебного контента. Контент живёт в коде (src/content/*),
// в БД хранится только прогресс пользователей по строковым id.

export type CourseId = "numbers" | "top100" | "verbs";

// Тип вопроса в тренировке и экзамене
export type QuestionKind =
   | "flashcard" // карточка «знал / не знал»
   | "choice" // выбор из 4 вариантов
   | "typed"; // ввод текста

// Направление вопроса: что показываем и что вводит пользователь
export type Direction =
   | "to-en" // показываем цифры / русское слово → ответ по-английски
   | "from-en"; // показываем английский → ответ цифрами / по-русски

export type Item = {
   id: string; // стабильный id: "num:42", "ord:3", "w:make"
   prompt: string; // лицевая сторона: "42", "42-й", "make"
   answer: string; // канонический ответ: "forty-two", "делать"
   // Дополнительная подпись к prompt (напр. «порядковое»)
   hint?: string;
};

export type Level = {
   id: string;
   title: string;
   items: Item[];
};

export type Course = {
   id: CourseId;
   title: string;
   description: string;
   levels: Level[];
   examStages: number;
};
