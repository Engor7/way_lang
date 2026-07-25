import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";

const COOKIE_NAME = "way_user";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // год

function authSecret(): string {
   const value = process.env.AUTH_SECRET;
   if (!value) {
      throw new Error("AUTH_SECRET is not set");
   }
   return value;
}

function sign(userId: number): string {
   return createHmac("sha256", authSecret())
      .update(`user:${userId}`)
      .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
   const bufA = Buffer.from(a);
   const bufB = Buffer.from(b);
   return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// Возвращает пользователя из cookie-сессии или null.
// Cookie: "<id>.<hmac>", подпись ключом AUTH_SECRET.
export async function getSessionUser() {
   const raw = (await cookies()).get(COOKIE_NAME)?.value;
   if (!raw) {
      return null;
   }
   const [idPart, signature] = raw.split(".");
   const id = Number(idPart);
   if (!Number.isInteger(id) || !signature || !safeEqual(signature, sign(id))) {
      return null;
   }
   const user = await db.query.users.findFirst({ where: eq(users.id, id) });
   return user ?? null;
}

// Для страниц, доступных только вошедшим: редирект на главную (форма входа).
export async function requireUser() {
   const user = await getSessionUser();
   if (!user) {
      redirect("/");
   }
   return user;
}

export async function createUserSession(userId: number): Promise<void> {
   (await cookies()).set(COOKIE_NAME, `${userId}.${sign(userId)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
   });
}

export async function clearUserSession(): Promise<void> {
   (await cookies()).delete(COOKIE_NAME);
}
