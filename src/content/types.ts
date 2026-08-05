// Типы учебного контента. Контент живёт в коде (src/content/*),
// в БД хранится только прогресс по строковым id.

// Курсов много и они генерируются из morewords.txt, поэтому id — просто
// строка (стабильный слаг, он же кусок URL: /course/<id>).
export type CourseId = string;

// Как устроен курс — от этого зависят вопросы, дистракторы и проверка ответа.
// Раньше на эти три случая проверяли course.id; теперь это явное поле, и
// новые словарные курсы просто берут "words".
export type CourseStyle =
   | "numbers" // prompt — цифры, answer — слова; проверка числительных
   | "verbs" // своя система вопросов: формы, примеры, пропуски
   | "words"; // prompt — английское слово/фраза, answer — русский перевод

// Раздел на главной: курсов много, списком они не читаются.
export type CourseGroup = "Основа" | "Слова" | "Фразы" | "Грамматика";

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
   group: CourseGroup;
   style: CourseStyle;
   levels: Level[];
   examStages: number;
};
