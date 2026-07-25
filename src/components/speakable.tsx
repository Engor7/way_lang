"use client";

// Озвучиваемый текст: клик по самому тексту проигрывает английскую озвучку
// (см. src/lib/audio.ts). text — что озвучить, children — что показать
// (например, цифры «42» при озвучке "forty-two").

import type { ReactNode } from "react";
import { speak } from "@/lib/audio";

type SpeakableProps = {
   text: string;
   children?: ReactNode;
   className?: string;
};

export function Speakable({ text, children, className }: SpeakableProps) {
   return (
      <button
         type="button"
         onClick={() => speak(text)}
         className={`speakable ${className ?? ""}`}
      >
         {children ?? text}
      </button>
   );
}
