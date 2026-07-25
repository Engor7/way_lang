// Генерация озвучки: mp3 для всех английских строк курсов через бесплатный
// Microsoft edge-tts (нейроголос). Файлы кладутся в public/audio/<курс>/,
// имя — слаг текста ("numbers/twenty-one.mp3"; при коллизии слагов
// добавляется короткий sha1-суффикс). Одинаковые слова между курсами
// дедуплицируются: файл лежит в папке первого курса, где слово встретилось.
// Манифест src/content/audio-manifest.json (текст → путь) переписывается всегда.
//
// Запуск: pnpm audio:generate [--force]  (--force — перегенерировать всё)

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { allItems, enSide, listCourses } from "../src/content";
import { splitExample, verbEntryOf } from "../src/content/verbs-course";

const VOICE = "en-US-JennyNeural";
const AUDIO_DIR = path.join(import.meta.dirname, "..", "public", "audio");
const MANIFEST_PATH = path.join(
   import.meta.dirname,
   "..",
   "src",
   "content",
   "audio-manifest.json",
);
const PAUSE_MS = 250; // не частим в бесплатный сервис
const FORCE = process.argv.includes("--force");

const usedNames = new Map<string, string>(); // путь (без .mp3) → текст

function fileNameFor(courseId: string, text: string): string {
   const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
   const hash = createHash("sha1").update(text).digest("hex");
   let name = `${courseId}/${slug || hash.slice(0, 8)}`;
   const takenBy = usedNames.get(name);
   if (takenBy !== undefined && takenBy !== text) {
      name = `${name}-${hash.slice(0, 6)}`;
   }
   usedNames.set(name, text);
   return `${name}.mp3`;
}

function sleep(ms: number): Promise<void> {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

function collectStream(stream: Readable): Promise<Buffer> {
   return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
   });
}

async function makeTts(): Promise<MsEdgeTTS> {
   const tts = new MsEdgeTTS();
   await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
   return tts;
}

// Текст для синтеза: ключ манифеста — точная строка контента, но «went — gone»
// и «was/were» должны звучать как перечисление, а не как «тире» и «слэш»
function ttsTextFor(text: string): string {
   return text.replace(/\s*—\s*/g, ", ").replace(/\//g, " or ");
}

async function main() {
   // уникальные английские строки всех курсов; папку задаёт первый курс
   const texts = new Map<string, string>(); // текст → путь файла
   for (const course of listCourses()) {
      for (const item of allItems(course)) {
         const text = enSide(course, item);
         if (!texts.has(text)) {
            texts.set(text, fileNameFor(course.id, text));
         }
         // у глаголов озвучиваем и «оборотную» сторону — формы и примеры
         if (course.id === "verbs") {
            const entry = verbEntryOf(item.id);
            const extra = [
               item.answer,
               ...(entry?.examples.map(
                  (example) => splitExample(example.en).clean,
               ) ?? []),
            ];
            for (const text of extra) {
               if (!texts.has(text)) {
                  texts.set(text, fileNameFor(course.id, text));
               }
            }
         }
      }
   }

   let tts = await makeTts();
   let generated = 0;
   let skipped = 0;
   let failed = 0;

   for (const [text, fileName] of texts) {
      const filePath = path.join(AUDIO_DIR, fileName);
      if (!FORCE && existsSync(filePath)) {
         skipped++;
         continue;
      }
      mkdirSync(path.dirname(filePath), { recursive: true });
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
         try {
            const { audioStream } = tts.toStream(ttsTextFor(text));
            const buffer = await collectStream(audioStream);
            if (buffer.length === 0) {
               throw new Error("empty audio");
            }
            writeFileSync(filePath, buffer);
            ok = true;
         } catch (error) {
            // пересоздаём соединение и пробуем ещё раз
            tts.close();
            tts = await makeTts();
            if (attempt === 1) {
               failed++;
               console.error(`FAIL "${text}": ${String(error)}`);
            }
         }
      }
      if (ok) {
         generated++;
         console.log(`ok  ${fileName}  "${text}"`);
      }
      await sleep(PAUSE_MS);
   }
   tts.close();

   // манифест — только реально существующие файлы, ключи отсортированы
   const manifest: Record<string, string> = {};
   for (const text of [...texts.keys()].sort()) {
      const fileName = texts.get(text) as string;
      if (existsSync(path.join(AUDIO_DIR, fileName))) {
         manifest[text] = fileName;
      }
   }
   writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 3)}\n`);

   console.log(
      `Всего строк: ${texts.size}, сгенерировано: ${generated}, ` +
         `пропущено: ${skipped}, ошибок: ${failed}`,
   );
   process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
   console.error(error);
   process.exit(1);
});
