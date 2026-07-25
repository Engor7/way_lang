import { redirect } from "next/navigation";
import { clearUserSession } from "@/lib/user-auth";

// Выход для пользователя — просто перейти на /logout (кнопки на сайте нет).
export async function GET(): Promise<void> {
   await clearUserSession();
   redirect("/");
}
