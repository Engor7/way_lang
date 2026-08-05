// Метаданные колод из morewords.txt: под каким id и в каком разделе колода
// станет курсом. Ключ — заголовок `##` ровно как в файле.
//
// Если в morewords.txt появится новая колода, скрипт build-vocab.ts упадёт
// с понятной ошибкой — сюда нужно будет дописать строку.

import type { CourseGroup } from "../src/content/types";

export type DeckMeta = {
   id: string; // слаг курса, он же кусок URL: /course/<id>
   group: CourseGroup;
   description: string;
   // Колода записана наоборот — русский слева («ходить — walk, go»).
   // Стороны меняются местами: карточкам нужен английский в prompt.
   swap?: true;
};

export const DECKS: Record<string, DeckMeta> = {
   "Действия (глаголы)": {
      id: "actions",
      group: "Слова",
      description: "Глаголы на каждый день: говорить, думать, двигаться, брать",
   },
   "Модальные глаголы": {
      id: "modals",
      group: "Грамматика",
      description: "can, must, should: что можно, что нужно и что придётся",
   },
   "Характер и качества": {
      id: "character",
      group: "Слова",
      description: "Какой человек: добрый, упрямый, щедрый, ленивый",
   },
   "Чувства и настроение": {
      id: "feelings",
      group: "Слова",
      description: "Рад, зол, устал, смущён — состояния и настроение",
   },
   Внешность: {
      id: "appearance",
      group: "Слова",
      description: "Рост, фигура, волосы, борода и очки",
   },
   "Размер и свойства": {
      id: "properties",
      group: "Слова",
      description: "Большой-маленький, тёплый-холодный, лёгкий-трудный",
   },
   "Красивые слова": {
      id: "beautiful-words",
      group: "Слова",
      description: "Изысканные: oblivion, mesmerising, gorgeous",
   },
   "Люди и семья": {
      id: "family",
      group: "Слова",
      description: "Родня, друзья, соседи и коллеги",
   },
   "Дом: комнаты и вещи": {
      id: "home-things",
      group: "Слова",
      description: "Комнаты, мебель, техника и посуда",
   },
   Одежда: {
      id: "clothes",
      group: "Слова",
      description: "Что носят и из чего это состоит",
   },
   "Еда и напитки": {
      id: "food",
      group: "Слова",
      description: "Продукты, блюда, фрукты и напитки",
   },
   Природа: {
      id: "nature",
      group: "Слова",
      description: "Деревья, горы, реки, небо и земля",
   },
   Погода: {
      id: "weather",
      group: "Слова",
      description: "Дождь, снег, жара и как о них говорить",
   },
   Животные: {
      id: "animals",
      group: "Слова",
      description: "Домашние и дикие, хвосты, лапы и крылья",
   },
   Насекомые: {
      id: "insects",
      group: "Слова",
      description: "Пчела, муравей, бабочка и компания",
   },
   "Еда: какая она": {
      id: "food-taste",
      group: "Слова",
      description: "Вкус и текстура: сладкий, острый, пережаренный",
   },
   "Части тела": {
      id: "body",
      group: "Слова",
      description: "От макушки до пятки",
   },
   "Здоровье и врач": {
      id: "health",
      group: "Слова",
      description: "Болезни, аптека и разговор с врачом",
   },
   "Город и места": {
      id: "city",
      group: "Слова",
      description: "Улицы, магазины, музеи, вокзалы",
   },
   Транспорт: {
      id: "transport",
      group: "Слова",
      description: "Машины, автобусы, поезда и всё вокруг них",
   },
   "Работа и деньги": {
      id: "work-money",
      group: "Слова",
      description: "Офис, зарплата, счета, скидки и профессии",
   },
   Учёба: {
      id: "study",
      group: "Слова",
      description: "Уроки, экзамены, тетради и ошибки",
   },
   "Технологии и интернет": {
      id: "tech",
      group: "Слова",
      description: "Телефон, ноутбук, пароли и приложения",
   },
   "Время: когда?": {
      id: "time",
      group: "Слова",
      description: "Сейчас, скоро, вчера, всегда — плюс часы и сезоны",
   },
   "Место и направление": {
      id: "place-direction",
      group: "Слова",
      description: "Здесь, там, внутри, наверх, налево",
   },
   "Степень и оценка": {
      id: "degree",
      group: "Грамматика",
      description: "Очень, слишком, почти, лучше и хуже",
   },
   "Количество и определители": {
      id: "quantity",
      group: "Грамматика",
      description: "some, any, many, few и «кусок, пара, половина»",
   },
   "Связки и вводные слова": {
      id: "linking",
      group: "Грамматика",
      description: "Однако, поэтому, кроме того, например",
   },
   "Союзы и условия": {
      id: "conjunctions",
      group: "Грамматика",
      description: "И, или, если, чтобы, как только",
   },
   "Вопросительные слова": {
      id: "question-words",
      group: "Грамматика",
      description: "Что, кто, где, сколько, как долго",
   },
   Местоимения: {
      id: "pronouns",
      group: "Грамматика",
      description: "Я-меня-мой, себя, кто-то и что-то",
   },
   Предлоги: {
      id: "prepositions",
      group: "Грамматика",
      description: "in, on, at, by и все остальные",
   },
   "Простые фразы с I": {
      id: "i-phrases",
      group: "Фразы",
      description: "Я знаю, я хочу, мне нужно",
   },
   "Короткие ответы и отрицания": {
      id: "short-answers",
      group: "Грамматика",
      description: "Yes, I do / No, I don't и семейство don't–didn't",
   },
   "Есть и нет: there is": {
      id: "there-is",
      group: "Грамматика",
      description: "there is, there are и их отрицания",
   },
   Намерения: {
      id: "intentions",
      group: "Фразы",
      description: "Я хотел бы, я собираюсь, мне придётся",
   },
   "Как я себя чувствую": {
      id: "i-feel",
      group: "Фразы",
      description: "I am tired, I am busy, I am lost",
   },
   "make и do": {
      id: "make-do",
      group: "Грамматика",
      description: "Когда make, а когда do",
   },
   "Приветствия и прощания": {
      id: "greetings",
      group: "Фразы",
      description: "Привет, до встречи, хорошего дня",
   },
   "Знакомство и small talk": {
      id: "small-talk",
      group: "Фразы",
      description: "Как тебя зовут, откуда ты, чем занимаешься",
   },
   "Реакции и поддержка": {
      id: "reactions",
      group: "Фразы",
      description: "Хорошо, молодец, не напрягайся",
   },
   "Извинения и вежливость": {
      id: "apologies",
      group: "Фразы",
      description: "Извини, спасибо, пожалуйста",
   },
   "Вопросы и просьбы": {
      id: "requests",
      group: "Фразы",
      description: "Можешь помочь? Можно мне…?",
   },
   "Когда не понял": {
      id: "not-understood",
      group: "Фразы",
      description: "Повторите, помедленнее, что это значит",
   },
   "Мнение и согласие": {
      id: "opinion",
      group: "Фразы",
      description: "Я думаю, я согласен, мне кажется",
   },
   Телефон: {
      id: "phone",
      group: "Фразы",
      description: "Слышишь меня? Я перезвоню",
   },
   Покупки: {
      id: "shopping",
      group: "Фразы",
      description: "Сколько стоит, можно примерить, я возьму",
   },
   "В ресторане": {
      id: "restaurant",
      group: "Фразы",
      description: "Столик, меню, счёт пополам",
   },
   "Дорога и такси": {
      id: "directions",
      group: "Фразы",
      description: "Как добраться, поверни направо, остановите здесь",
   },
   "Путешествие и аэропорт": {
      id: "travel",
      group: "Фразы",
      description: "Регистрация, гейт, багаж, пересадка",
   },
   "В отеле": {
      id: "hotel",
      group: "Фразы",
      description: "Бронь, номер, завтрак, выезд",
   },
   "Экстренные ситуации": {
      id: "emergency",
      group: "Фразы",
      description: "Помогите, вызовите скорую, я потерял паспорт",
   },
   "Дом и быт": {
      id: "household",
      group: "Фразы",
      description: "Убери комнату, вынеси мусор, ужин готов",
   },
   "Музыка и концерт": {
      id: "music",
      group: "Фразы",
      description: "Мне нравится эта песня, давай потанцуем",
   },
   "Отношения и близкие": {
      id: "relationships",
      group: "Фразы",
      description: "Я скучаю, ты в порядке, давай поговорим",
   },
   "Свободное время и хобби": {
      id: "hobbies",
      group: "Слова",
      description: "Спорт, кино, рыбалка, вечеринки",
   },
   "Разговорные усилители": {
      id: "intensifiers",
      group: "Фразы",
      description: "absolutely, definitely, honestly",
   },
   "Слова-филлеры": {
      id: "fillers",
      group: "Фразы",
      description: "Ну, типа, короче — чем заполняют паузы",
   },
   "Разговорные сокращения": {
      id: "contractions",
      group: "Фразы",
      description: "gonna, wanna, dunno и прочая живая речь",
   },
   "Частые выражения": {
      id: "common-expressions",
      group: "Фразы",
      description: "by the way, just in case, it's up to you",
   },
   "Фразовые глаголы": {
      id: "phrasal-verbs",
      group: "Грамматика",
      description: "take, come, put, go, get, look — и что меняет предлог",
   },
   "Ходить: русские приставки": {
      id: "walking-prefixes",
      group: "Грамматика",
      description: "Выходить, приходить, переходить — как это по-английски",
      swap: true,
   },
   "Предлог at": {
      id: "prep-at",
      group: "Грамматика",
      description: "at home, at work, at night",
   },
   "Предлог in": {
      id: "prep-in",
      group: "Грамматика",
      description: "in the box, in the morning, in summer",
   },
   "Предлог on": {
      id: "prep-on",
      group: "Грамматика",
      description: "on Monday, on the table, on the way",
   },
   "Предлог to": {
      id: "prep-to",
      group: "Грамматика",
      description: "to school, to the left, to my friend",
   },
   "Дни недели": {
      id: "weekdays",
      group: "Слова",
      description: "Семь дней и боги, в честь которых их назвали",
   },
   Месяцы: {
      id: "months",
      group: "Слова",
      description: "Двенадцать месяцев и их римские корни",
   },
   "Английский в программировании": {
      id: "programming",
      group: "Слова",
      description: "fetch, request, promise, merge — слова из кода",
   },
};
