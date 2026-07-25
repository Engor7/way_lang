"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCourse } from "@/content";
import { db } from "@/db";
import { examAttempts, itemProgress, users } from "@/db/schema";
import {
   clearSession,
   createSession,
   requireAdmin,
   verifyPassword,
} from "@/lib/admin-auth";

export async function login(formData: FormData): Promise<void> {
   const password = String(formData.get("password") ?? "");
   if (!verifyPassword(password)) {
      redirect("/admin/login?error=1");
   }
   await createSession(formData.get("remember") === "on");
   redirect("/admin");
}

export async function logout(): Promise<void> {
   await clearSession();
   redirect("/admin/login");
}

// Пароль-код уникален (по нему происходит вход на сайте).
async function passwordTaken(password: string, exceptId?: number) {
   const existing = await db.query.users.findFirst({
      where: eq(users.password, password),
   });
   return existing !== undefined && existing.id !== exceptId;
}

async function generatePassword(): Promise<string> {
   for (let i = 0; i < 5; i++) {
      const candidate = randomBytes(4).toString("hex"); // 8 символов
      if (!(await passwordTaken(candidate))) {
         return candidate;
      }
   }
   throw new Error("Failed to generate a unique password");
}

export async function createUser(formData: FormData): Promise<void> {
   await requireAdmin();
   const name = String(formData.get("name") ?? "").trim();
   let password = String(formData.get("password") ?? "").trim();
   if (!name) {
      return;
   }
   if (!password) {
      password = await generatePassword();
   } else if (await passwordTaken(password)) {
      redirect("/admin?error=duplicate");
   }
   await db.insert(users).values({ name, password });
   revalidatePath("/admin");
   redirect("/admin");
}

export async function updateUser(formData: FormData): Promise<void> {
   await requireAdmin();
   const id = Number(formData.get("id"));
   const name = String(formData.get("name") ?? "").trim();
   const password = String(formData.get("password") ?? "").trim();
   if (!Number.isInteger(id) || !name || !password) {
      return;
   }
   if (await passwordTaken(password, id)) {
      redirect("/admin?error=duplicate");
   }
   await db.update(users).set({ name, password }).where(eq(users.id, id));
   revalidatePath("/admin");
   redirect("/admin");
}

// Полный сброс курса у пользователя: прогресс по элементам и все попытки
// супер-теста — как будто он к курсу не приступал.
export async function resetCourseProgress(formData: FormData): Promise<void> {
   await requireAdmin();
   const userId = Number(formData.get("userId"));
   const course = getCourse(String(formData.get("courseId")));
   if (!Number.isInteger(userId) || !course) {
      return;
   }
   await db
      .delete(itemProgress)
      .where(
         and(
            eq(itemProgress.userId, userId),
            eq(itemProgress.courseId, course.id),
         ),
      );
   await db
      .delete(examAttempts)
      .where(
         and(
            eq(examAttempts.userId, userId),
            eq(examAttempts.courseId, course.id),
         ),
      );
   revalidatePath("/admin");
   redirect("/admin");
}

export async function deleteUser(formData: FormData): Promise<void> {
   await requireAdmin();
   const id = Number(formData.get("id"));
   if (!Number.isInteger(id)) {
      return;
   }
   await db.delete(users).where(eq(users.id, id));
   revalidatePath("/admin");
   redirect("/admin");
}
