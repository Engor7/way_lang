// Озвучка английского текста на клиенте. Основной источник — заранее
// сгенерированные mp3 (см. scripts/generate-audio.ts, манифест
// src/content/audio-manifest.json). Если файла для текста нет или он не
// загрузился — запасной вариант: браузерный speechSynthesis (en-US).

import manifest from "@/content/audio-manifest.json";

const AUDIO_MANIFEST: Record<string, string> = manifest;

// один <audio> на всё приложение — новое воспроизведение обрывает предыдущее
let player: HTMLAudioElement | null = null;

function audioUrlFor(text: string): string | null {
   const file = AUDIO_MANIFEST[text];
   return file ? `/audio/${file}` : null;
}

function speakWithSynthesis(text: string): void {
   if (!("speechSynthesis" in window)) {
      return;
   }
   window.speechSynthesis.cancel();
   const utterance = new SpeechSynthesisUtterance(text);
   utterance.lang = "en-US";
   utterance.rate = 0.95;
   // голоса подгружаются асинхронно; если списка ещё нет — хватит lang
   const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("en-US"));
   if (voice) {
      utterance.voice = voice;
   }
   window.speechSynthesis.speak(utterance);
}

export function speak(text: string): void {
   if (typeof window === "undefined") {
      return;
   }
   stopSpeech();
   const url = audioUrlFor(text);
   if (!url) {
      speakWithSynthesis(text);
      return;
   }
   if (!player) {
      player = new Audio();
   }
   player.onerror = () => speakWithSynthesis(text);
   player.src = url;
   // блокировку autoplay (до первого жеста) молча глотаем —
   // пользователь всегда может нажать на динамик
   player.play().catch(() => {});
}

export function stopSpeech(): void {
   if (typeof window === "undefined") {
      return;
   }
   if (player) {
      player.onerror = null;
      player.pause();
      player.currentTime = 0;
   }
   if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
   }
}
