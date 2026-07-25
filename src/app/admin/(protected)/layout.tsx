import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import styles from "../admin.module.scss";

export const metadata = { title: "Admin — Way Lang" };

export default async function AdminLayout({
   children,
}: {
   children: ReactNode;
}) {
   await requireAdmin();

   return (
      <div className={styles.shell}>
         <header className={styles.header}>
            <h1 className={styles.title}>Way Lang — Admin</h1>
            <form action={logout}>
               <button type="submit" className="btn btn--outline btn--sm">
                  <LogOut size={14} />
                  Выйти
               </button>
            </form>
         </header>
         {children}
      </div>
   );
}
