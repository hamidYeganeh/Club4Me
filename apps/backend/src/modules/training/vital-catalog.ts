import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { z } from "zod";
import { EXERCISES } from "./exercise-catalog";

const names = [
  "فلای دستگاه پک‌دک",
  "پرس سوند",
  "ایربایک",
  "اسکوات هالتر از پشت",
  "اسپلیت اسکوات بلغاری هالتر",
  "اسکوات هالتر از جلو",
  "هیپ تراست هالتر",
  "مارچ با هالتر",
  "لانج معکوس هالتر",
  "ددلیفت رومانیایی هالتر",
  "کیک‌بک پا سیم‌کش",
  "دوچرخه ثابت",
  "اسپلیت اسکوات بلغاری دمبل",
  "گابلت اسکوات دمبل",
  "هیپ هینج دمبل",
  "اسکوات پرشی دمبل",
  "الپتیکال تناوبی",
  "هاک اسکوات دستگاه",
  "خارج ران دستگاه",
  "مارچ با کتل‌بل",
  "بالا کشیدن کتل‌بل",
  "سوئینگ کتل‌بل",
  "جلو پا دستگاه",
  "پرس پا دستگاه",
  "پشت پا خوابیده دستگاه",
  "بتل روپ",
  "دستگاه روئینگ",
  "دویدن روی تردمیل",
  "پشت پا نشسته دستگاه",
  "پرس بالای سر نشسته",
  "استپ‌آپ با وزنه",
  "دستگاه پله — نوع اول",
  "دستگاه پله",
  "ددلیفت پا صاف دستگاه",
  "پشت بازو سیم‌کش طنابی",
  "راه رفتن روی تردمیل",
  "پرس آرنولدی دمبل",
  "پرس سرشانه هالتر ایستاده",
  "کول هالتر",
  "پرس سرشانه دمبل",
  "کول دمبل",
  "نشر جلو دمبل",
  "نشر جلو صفحه",
  "پرس سرشانه کتل‌بل",
  "نشر جانب کراس سیم‌کش",
  "نشر جانب دمبل",
  "نشر جانب دستگاه",
  "پرس سرشانه اسمیت نشسته",
  "فلای معکوس دستگاه",
  "نشر خم سیم‌کش",
];
const muscles: Record<string, string> = {
  chest: "سینه",
  cardio: "هوازی",
  "upper legs": "پا",
  shoulders: "سرشانه",
  "upper arms": "بازو",
};
const equipment: Record<string, string> = {
  machine: "دستگاه",
  "body weight": "وزن بدن",
  barbell: "هالتر",
  cable: "سیم‌کش",
  dumbbell: "دمبل",
  kettlebell: "کتل‌بل",
};
const entry = z.object({
  id: z.string().regex(/^vital:\d{4}$/),
  sourceId: z.string().regex(/^\d{4}$/),
  name: z.string(),
  bodyPart: z.string(),
  equipment: z.array(z.string()),
  translations: z.array(z.object({ description: z.string() })).min(1),
  media: z
    .array(z.object({ localPath: z.string().regex(/^media\/\d{4}\.mp4$/) }))
    .min(1),
});
export type CatalogExercise = (typeof EXERCISES)[number] & {
  originalName?: string;
  animation?: boolean;
  instructionsLanguage?: string;
  attribution?: { publisher: string; licenseUrl: string };
};
export function loadVitalCatalog(directory?: string): {
  items: CatalogExercise[];
  files: Map<string, string>;
} {
  if (!directory) return { items: [], files: new Map() };
  const root = realpathSync(directory);
  const parsed = z
    .object({ exercises: z.array(entry).length(50) })
    .parse(JSON.parse(readFileSync(resolve(root, "catalog.json"), "utf8")));
  const files = new Map<string, string>();
  const items = parsed.exercises.map((e) => {
    if (
      e.id !== `vital:${e.sourceId}` ||
      files.has(e.id) ||
      Number(e.sourceId) < 51 ||
      Number(e.sourceId) > 100
    )
      throw new Error("Invalid Vital identity");
    if (e.media[0]!.localPath !== `media/${e.sourceId}.mp4`)
      throw new Error("Mismatched Vital media");
    const file = realpathSync(resolve(root, e.media[0]!.localPath));
    if (!file.startsWith(root + sep) || !statSync(file).isFile())
      throw new Error("Invalid Vital media path");
    files.set(e.id, file);
    return {
      id: e.id,
      name: names[Number(e.sourceId) - 51]!,
      originalName: e.name,
      muscle: muscles[e.bodyPart] ?? e.bodyPart,
      equipment:
        e.sourceId === "0052"
          ? "صفحه وزنه"
          : e.equipment.map((x) => equipment[x] ?? x).join("، "),
      instructions: e.translations[0]!.description,
      instructionsLanguage: "en",
      animation: true,
      attribution: {
        publisher: "Vital Animations",
        licenseUrl: "https://vitalanimations.com/license",
      },
    };
  });
  return { items, files };
}
let cached: ReturnType<typeof loadVitalCatalog> | undefined;
function vital() {
  if (!cached) {
    const devPaths = [
      resolve(process.cwd(), "data/exercise-catalog/runs/vital-active"),
      resolve(process.cwd(), "../../data/exercise-catalog/runs/vital-active"),
    ];
    const directory =
      process.env.TRAINING_CATALOG_DIR ||
      (process.env.NODE_ENV !== "production"
        ? devPaths.find((p) => existsSync(resolve(p, "catalog.json")))
        : undefined);
    cached = loadVitalCatalog(directory);
  }
  return cached;
}
export const trainingExercises = (): CatalogExercise[] => [
  ...vital().items,
  ...EXERCISES,
];
export const trainingAnimation = (id: string) => vital().files.get(id);
