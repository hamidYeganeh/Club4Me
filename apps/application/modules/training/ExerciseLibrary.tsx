"use client";
import { DiscoveryFilterSheet } from "@modules/discovery/components/DiscoveryFilterSheet";
import { DiscoveryVirtualItems } from "@modules/discovery/components/DiscoveryViewport";
import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { VisualEmptyState } from "@/components/ui/clarity";
import { trainingApi } from "@api/domains/training";
import { Dumbbell } from "lucide-react";
import workoutStyles from "./workout-cards.module.css";
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
        حرکت مناسب را بر اساس عضله و تجهیزات پیدا کن؛ راهنمای اجرا و نمایش حرکت
        همراهت است.
      </p>
      <div className="space-y-3">
        <label>
          جست‌وجوی حرکت
          <HeroInput
            className={fieldClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </label>
        <DiscoveryFilterSheet
          title="فیلتر حرکات"
          activeCount={Number(Boolean(muscle)) + Number(Boolean(equipment))}
          resultCount={items.length}
        >
          {" "}
          <label>
            عضله
            <FormSelect
              aria-label="عضله"
              className={fieldClass}
              value={muscle}
              onChange={(e) => setMuscle(e)}
            >
              <FormOption value="">همه عضلات</FormOption>
              {[...new Set(all.map((e) => e.muscle))].map((x) => (
                <FormOption key={x}>{x}</FormOption>
              ))}
            </FormSelect>
          </label>
          <label>
            تجهیزات
            <FormSelect
              aria-label="تجهیزات"
              className={fieldClass}
              value={equipment}
              onChange={(e) => setEquipment(e)}
            >
              <FormOption value="">همه تجهیزات</FormOption>
              {[...new Set(all.map((e) => e.equipment))].map((x) => (
                <FormOption key={x}>{x}</FormOption>
              ))}
            </FormSelect>
          </label>
          <Button
            variant="secondary"
            onPress={() => {
              setMuscle("");
              setEquipment("");
            }}
          >
            پاک‌کردن فیلترها
          </Button>
        </DiscoveryFilterSheet>{" "}
      </div>
      {!library.loading && !library.error ? (
        <div className="flex flex-wrap items-center gap-2">
          <p role="status" className="me-auto text-sm text-muted">
            {items.length.toLocaleString("fa-IR")} حرکت
          </p>
          {muscle ? (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`حذف فیلتر عضله ${muscle}`}
              onPress={() => setMuscle("")}
            >
              {muscle}
              <span aria-hidden>×</span>
            </Button>
          ) : null}
          {equipment ? (
            <Button
              size="sm"
              variant="secondary"
              aria-label={`حذف فیلتر تجهیزات ${equipment}`}
              onPress={() => setEquipment("")}
            >
              {equipment}
              <span aria-hidden>×</span>
            </Button>
          ) : null}
        </div>
      ) : null}
      <LoadState {...library} />
      {library.stale && <Notice>نسخه ذخیره‌شده دستگاه را می‌بینی.</Notice>}
      {!library.loading && !library.error && !items.length && (
        <VisualEmptyState
          icon="file-magnifying-glass"
          title="حرکتی با این فیلتر پیدا نشد."
          description="نام دیگری را امتحان کن یا فیلترها را بردار تا حرکت‌های بیشتری ببینی."
          action={
            search || muscle || equipment ? (
              <Button
                variant="secondary"
                onPress={() => {
                  setSearch("");
                  setMuscle("");
                  setEquipment("");
                }}
              >
                نمایش همه حرکات
              </Button>
            ) : undefined
          }
        />
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <DiscoveryVirtualItems>
          {items.map((e) => (
            <Card key={e.id} className={`app-card ${workoutStyles.library}`}>
              <div className={workoutStyles.libraryCover}>
                <span className={workoutStyles.badge}>{e.muscle}</span>
                <Dumbbell size={56} strokeWidth={1} aria-hidden="true" />
              </div>
              <Card.Header className={workoutStyles.libraryHeader}>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="text-xs leading-6 text-muted">
                    {e.equipment}
                  </span>
                </div>
                <Card.Title className={workoutStyles.title}>
                  {e.name}
                </Card.Title>
              </Card.Header>
              <Card.Content className={workoutStyles.libraryBody}>
                {e.animation && <ExerciseAnimation id={e.id} name={e.name} />}
                {e.originalName && (
                  <p dir="ltr" className="text-sm text-muted">
                    {e.originalName}
                  </p>
                )}
                <details
                  className="mt-3"
                  open={e.instructionsLanguage !== "en"}
                >
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
        </DiscoveryVirtualItems>
      </div>
    </TrainingFrame>
  );
}
