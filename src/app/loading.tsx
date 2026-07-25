import { LoaderCircle } from "lucide-react";

// Показывается мгновенно при переходе, пока серверная страница ждёт данные из
// БД. Спиннер появляется с задержкой (.page-loader в global.scss), чтобы не
// мигать, когда страница загрузилась быстро.
export default function Loading() {
   return (
      <div className="screen-center">
         <div className="page-loader">
            <LoaderCircle size={28} aria-label="Загрузка" />
         </div>
      </div>
   );
}
