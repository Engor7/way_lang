"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCourse } from "@/content";
import { db } from "@/db";
import { examAttempts } from "@/db/schema";
import {
   buildExamPlan,
   finalPercent,
   gradeStage,
   letterGrade,
} from "@/lib/exam";
import { recordAnswers } from "@/lib/stats";

async function findActiveAttempt(courseId: string) {
   const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(
         and(
            eq(examAttempts.courseId, courseId),
            eq(examAttempts.status, "in_progress"),
         ),
      )
      .orderBy(desc(examAttempts.startedAt))
      .limit(1);
   return attempt;
}

// Начать супер-тест (или продолжить активную попытку)
export async function startExam(formData: FormData): Promise<void> {
   const course = getCourse(String(formData.get("courseId")));
   if (!course) {
      return;
   }
   const active = await findActiveAttempt(course.id);
   if (!active) {
      await db.insert(examAttempts).values({
         courseId: course.id,
         plan: buildExamPlan(course),
      });
   }
   redirect(`/course/${course.id}/exam/stage`);
}

// Бросить активную попытку и начать заново
export async function restartExam(formData: FormData): Promise<void> {
   const course = getCourse(String(formData.get("courseId")));
   if (!course) {
      return;
   }
   await db
      .update(examAttempts)
      .set({ status: "abandoned", finishedAt: new Date() })
      .where(
         and(
            eq(examAttempts.courseId, course.id),
            eq(examAttempts.status, "in_progress"),
         ),
      );
   await db.insert(examAttempts).values({
      courseId: course.id,
      plan: buildExamPlan(course),
   });
   redirect(`/course/${course.id}/exam/stage`);
}

export type StageSubmission = {
   attemptId: number;
   stageIndex: number;
   answers: string[];
};

// Сдать этап целиком. Guard в WHERE (номер этапа + статус) защищает от
// двойной отправки: повторный запрос просто ничего не обновит.
export async function submitExamStage(input: StageSubmission): Promise<void> {
   const [attempt] = await db
      .select()
      .from(examAttempts)
      .where(eq(examAttempts.id, input.attemptId))
      .limit(1);
   const course = attempt ? getCourse(attempt.courseId) : null;
   if (!attempt || !course || attempt.status !== "in_progress") {
      redirect("/");
   }
   const stage = attempt.plan[input.stageIndex];
   if (!stage || input.stageIndex !== attempt.stageResults.length) {
      redirect(`/course/${course.id}/exam`);
   }

   const { correct, total } = gradeStage(course, stage, input.answers);
   const results = [...attempt.stageResults, { correct, total }];
   const isLast = results.length === attempt.plan.length;
   const percent = finalPercent(results);

   await db
      .update(examAttempts)
      .set({
         stageResults: results,
         ...(isLast
            ? {
                 status: "finished",
                 percent,
                 grade: letterGrade(percent),
                 finishedAt: new Date(),
              }
            : {}),
      })
      .where(
         and(
            eq(examAttempts.id, attempt.id),
            eq(examAttempts.status, "in_progress"),
            sql`json_array_length(${examAttempts.stageResults}) = ${input.stageIndex}`,
         ),
      );
   await recordAnswers(total, correct);

   redirect(`/course/${course.id}/exam`);
}
