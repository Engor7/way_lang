// Тематические курсы из morewords.txt. Данные генерируются скриптом
// (pnpm vocab:build) в vocab.json — руками его не правят, правят словарь.

import type { Course } from "./types";
import vocab from "./vocab.json";

// JSON типизируется как string-литералы шире нужного (group/style), поэтому
// приведение. Форму гарантирует скрипт: он собирает объекты по типу Course.
export const vocabCourses = vocab as Course[];
