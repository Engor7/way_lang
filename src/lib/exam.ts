// Супер-тест: сборка плана попытки, оценка этапов, итоговый грейд.
// Чистые функции — работа с БД в server actions страниц экзамена.

import {
   allItems,
   checkChoiceAnswer,
   checkTypedAnswer,
   getItem,
   shuffle,
} from "@/content";
import type { Course, Direction } from "@/content/types";
import type { ExamPlan, ExamQuestion, StageResult } from "@/db/schema";

export type Grade = "A" | "B" | "C" | "D" | "F";

// План фиксируется при создании попытки: все элементы курса перемешиваются
// и делятся на examStages этапов, ~половина вопросов — выбор, половина — ввод.
export function buildExamPlan(course: Course): ExamPlan {
   const items = shuffle(allItems(course));
   const perStage = Math.ceil(items.length / course.examStages);
   const stages: ExamPlan = [];
   for (let s = 0; s < course.examStages; s++) {
      const chunk = items.slice(s * perStage, (s + 1) * perStage);
      stages.push(
         chunk.map((item, i) => {
            const kind = i % 2 === 0 ? "choice" : "typed";
            // глаголы: всегда база → формы
            let direction: Direction =
               course.style === "verbs" ? "from-en" : "to-en";
            if (course.style === "words" && kind === "choice") {
               // слова и фразы: случайное направление в выборе
               direction = Math.random() < 0.5 ? "from-en" : "to-en";
            } else if (course.style === "numbers" && kind === "typed") {
               // ввод чисел — в обе стороны
               direction = Math.random() < 0.5 ? "from-en" : "to-en";
            }
            return { itemId: item.id, kind, direction };
         }),
      );
   }
   return stages.filter((stage) => stage.length > 0);
}

export function gradeStage(
   course: Course,
   stage: ExamQuestion[],
   answers: string[],
): StageResult & { perQuestion: boolean[] } {
   const perQuestion = stage.map((question, i) => {
      const item = getItem(course, question.itemId);
      const answer = answers[i] ?? "";
      if (!item || answer === "") {
         return false;
      }
      return question.kind === "choice"
         ? checkChoiceAnswer(course, item, question.direction, answer)
         : checkTypedAnswer(course, item, question.direction, answer);
   });
   return {
      correct: perQuestion.filter(Boolean).length,
      total: stage.length,
      perQuestion,
   };
}

export function finalPercent(results: StageResult[]): number {
   const total = results.reduce((sum, r) => sum + r.total, 0);
   const correct = results.reduce((sum, r) => sum + r.correct, 0);
   return total === 0 ? 0 : Math.round((100 * correct) / total);
}

export function letterGrade(percent: number): Grade {
   if (percent >= 90) return "A";
   if (percent >= 80) return "B";
   if (percent >= 70) return "C";
   if (percent >= 60) return "D";
   return "F";
}
