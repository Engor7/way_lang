import { redirect } from "next/navigation";
import { login } from "@/app/admin/actions";
import { isAdmin } from "@/lib/admin-auth";
import styles from "../admin.module.scss";

export const metadata = { title: "Admin — Way Lang" };

export default async function AdminLoginPage({
   searchParams,
}: {
   searchParams: Promise<{ error?: string }>;
}) {
   if (await isAdmin()) {
      redirect("/admin");
   }
   const { error } = await searchParams;

   return (
      <main className="screen-center">
         <form action={login} className={styles.loginCard}>
            <h1 className={styles.loginTitle}>Admin</h1>
            <input
               type="password"
               name="password"
               placeholder="Пароль"
               required
               className="input"
            />
            <label className={styles.remember}>
               <input
                  type="checkbox"
                  name="remember"
                  defaultChecked
                  className={styles.checkbox}
               />
               Запомнить меня
            </label>
            {error && <p className={styles.error}>Неверный пароль</p>}
            <button type="submit" className="btn btn--primary btn--block">
               Войти
            </button>
         </form>
      </main>
   );
}
