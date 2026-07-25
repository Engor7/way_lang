import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "way_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // год

function adminPassword(): string {
   const value = process.env.ADMIN_PASSWORD;
   if (!value) {
      throw new Error("ADMIN_PASSWORD is not set");
   }
   return value;
}

// Токен сессии детерминирован от пароля: смена ADMIN_PASSWORD разлогинивает всех.
function sessionToken(): string {
   return createHmac("sha256", adminPassword())
      .update("way-lang-admin-session")
      .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
   const bufA = Buffer.from(a);
   const bufB = Buffer.from(b);
   return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifyPassword(password: string): boolean {
   return safeEqual(password, adminPassword());
}

export async function isAdmin(): Promise<boolean> {
   const token = (await cookies()).get(COOKIE_NAME)?.value;
   return Boolean(token) && safeEqual(token as string, sessionToken());
}

export async function requireAdmin(): Promise<void> {
   if (!(await isAdmin())) {
      redirect("/admin/login");
   }
}

// remember=false — сессионная cookie, живёт до закрытия браузера
export async function createSession(remember: boolean): Promise<void> {
   (await cookies()).set(COOKIE_NAME, sessionToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
   });
}

export async function clearSession(): Promise<void> {
   (await cookies()).delete(COOKIE_NAME);
}
