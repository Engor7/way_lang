"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSession } from "@/lib/user-auth";

// Вход по одному лишь паролю-коду: он уникален и определяет пользователя.
export async function loginUser(formData: FormData): Promise<void> {
   const password = String(formData.get("password") ?? "").trim();
   if (!password) {
      redirect("/?error=1");
   }
   const user = await db.query.users.findFirst({
      where: eq(users.password, password),
   });
   if (!user) {
      redirect("/?error=1");
   }
   await createUserSession(user.id);
   redirect("/");
}
