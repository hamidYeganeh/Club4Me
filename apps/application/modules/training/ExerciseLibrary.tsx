"use client";
import { useState } from "react";
import { Card } from "@heroui/react";
import { trainingApi } from "@api/domains/training";
import { ExerciseAnimation } from "./ExerciseAnimation";
import {
  fieldClass,
  LoadState,
  Notice,
  TrainingFrame,
  useTrainingData,
} from "./shared";

export function ExerciseLibrary({ coach = false }: { coach?: boolean }) {
  const library = useTrainingData("exercises", trainingApi.exercises, true);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const all = library.data?.items ?? [];
  const items = all.filter(
    (e) =>
      `${e.name} ${e.originalName ?? ""} ${e.instructions}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()) &&
      (!muscle || e.muscle === muscle) &&
      (!equipment || e.equipment === equipment),
  );
  return (
    <TrainingFrame title="کتابخانه حرکات" coach={coach}>
      <p className="text-muted">
        حرکت مناسب را بر اساس عضله و وسیله پیدا کن. انیمیشن‌ها با انتخاب شما از
        سرور خودمان دریافت می‌شوند.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>
          جست‌وجوی حرکت
          <input
            className={fieldClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </label>
        <label>
          عضله
          <select
            className={fieldClass}
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
          >
            <option value="">همه عضلات</option>
            {[...new Set(all.map((e) => e.muscle))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          تجهیزات
          <select
            className={fieldClass}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="">همه تجهیزات</option>
            {[...new Set(all.map((e) => e.equipment))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <LoadState {...library} />
      {library.stale && <Notice>نسخه ذخیره‌شده دستگاه را می‌بینی.</Notice>}
      {!library.loading && !library.error && !items.length && (
        <Notice>حرکتی با این فیلتر پیدا نشد.</Notice>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((e) => (
          <Card key={e.id} className="p-5">
            <Card.Header>
              <p className="text-xs text-muted">
                {e.muscle} · {e.equipment}
              </p>
              <Card.Title>{e.name}</Card.Title>
            </Card.Header>
            <Card.Content>
              {e.animation && <ExerciseAnimation id={e.id} name={e.name} />}
              {e.originalName && (
                <p dir="ltr" className="text-sm text-muted">
                  {e.originalName}
                </p>
              )}
              <details className="mt-3" open={e.instructionsLanguage !== "en"}>
                <summary className="cursor-pointer">
                  {e.instructionsLanguage === "en"
                    ? "راهنمای منبع (انگلیسی)"
                    : "راهنمای اجرا"}
                </summary>
                <p
                  dir={e.instructionsLanguage === "en" ? "ltr" : "rtl"}
                  className="whitespace-pre-line text-sm leading-8"
                >
                  {e.instructions}
                </p>
              </details>
              {e.attribution && (
                <p className="mt-3 text-xs text-muted">
                  انیمیشن: {e.attribution.publisher} ·{" "}
                  <a
                    href={e.attribution.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    مجوز استفاده
                  </a>
                </p>
              )}
            </Card.Content>
          </Card>
        ))}
      </div>
    </TrainingFrame>
  );
}
