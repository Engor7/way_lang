// Курс «500 полезных фраз». Данные генерируются скриптом
// (pnpm phrases:build) в phrases.json из «500 полезных английских фраз.txt» —
// руками json не правят, правят текстовый источник.

import phrases from "./phrases.json";
import type { Course } from "./types";

// JSON типизируется как string шире нужного (group/style), поэтому приведение.
// Форму гарантирует скрипт: он собирает объект по типу Course.
export const phrasesCourse = phrases as Course;
