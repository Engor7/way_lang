import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import styles from "./back-nav.module.scss";

// Навигация в шапке страниц курса: «Назад» (уровень выше) + «Главная»

export function BackNav({ backHref }: { backHref: string }) {
   return (
      <nav className={styles.nav}>
         <Link href={backHref} className={styles.link}>
            <ArrowLeft size={14} className={styles.arrow} />
            Назад
         </Link>
         <Link href="/" className={styles.link}>
            Главная
         </Link>
      </nav>
   );
}
