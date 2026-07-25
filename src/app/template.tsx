import type { ReactNode } from "react";

// Перемонтируется при каждом переходе между страницами — новая страница
// плавно появляется (см. animate-page-in в global.scss)
export default function Template({ children }: { children: ReactNode }) {
   return <div className="animate-page-in">{children}</div>;
}
