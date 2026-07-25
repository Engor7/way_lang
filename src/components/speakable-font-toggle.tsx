"use client";

// Тумблер шрифта: включает Playfair Display (italic) для крупного текста
// вопроса (класс question-accent). Состояние — класс `speakable-playfair`
// на <html> (правило в src/style/global.css) + localStorage.

import { useEffect, useState } from "react";
import styles from "./speakable-font-toggle.module.scss";

const STORAGE_KEY = "speakable-font";
const HTML_CLASS = "speakable-playfair";

export function SpeakableFontToggle() {
   const [enabled, setEnabled] = useState(false);

   useEffect(() => {
      const on = localStorage.getItem(STORAGE_KEY) === "playfair";
      setEnabled(on);
      document.documentElement.classList.toggle(HTML_CLASS, on);
   }, []);

   function toggle() {
      const next = !enabled;
      setEnabled(next);
      document.documentElement.classList.toggle(HTML_CLASS, next);
      if (next) {
         localStorage.setItem(STORAGE_KEY, "playfair");
      } else {
         localStorage.removeItem(STORAGE_KEY);
      }
   }

   return (
      <button
         type="button"
         role="switch"
         aria-checked={enabled}
         onClick={toggle}
         title="Playfair Display для озвучиваемого текста"
         className={styles.toggle}
      >
         <span className={`${styles.sample} ${enabled ? styles.sampleOn : ""}`}>
            Aa
         </span>
         <span className={`${styles.track} ${enabled ? styles.trackOn : ""}`}>
            <span
               className={`${styles.knob} ${enabled ? styles.knobOn : ""}`}
            />
         </span>
      </button>
   );
}
