"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, Card, Skeleton, toast, Typography } from "@heroui/react";
import {
  useCoachProfile,
  useCreateCoachMedia,
  useCoachSports,
  useReplaceCoachSports,
  useUpdateCoachProfile,
} from "@api";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { FormPageSkeleton } from "@/components/loading-skeletons";

const input =
  "h-12 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function CoachProfileFormScreen() {
  const profile = useCoachProfile();
  const update = useUpdateCoachProfile();
  const coachSports = useCoachSports();
  const replaceSports = useReplaceCoachSports();
  const createMedia = useCreateCoachMedia();
  const sportsCatalog = usePublicCatalogResource("sports", "sport");
  const [displayName, setDisplayName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [languages, setLanguages] = useState("فارسی");
  const [serviceModes, setServiceModes] = useState<string[]>(["club"]);
  const [phone, setPhone] = useState("");
  const [sportIds, setSportIds] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState("");
  const [trainingStyles, setTrainingStyles] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [faqs, setFaqs] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState("");

  useEffect(() => {
    if (!profile.data) return;
    // The server profile provides the initial values of this edit form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.data.displayName);
    setShortBio(profile.data.shortBio);
    setBio(profile.data.bio);
    setExperienceYears(profile.data.experienceYears);
    setLanguages(profile.data.languages.join("، "));
    setServiceModes(profile.data.serviceModes);
    setSpecialties(
      profile.data.specialties
        .map((item) => `${item.title} | ${item.description}`)
        .join("\n"),
    );
    setTrainingStyles(
      (profile.data.trainingStyles ?? [])
        .map((item) =>
          [
            item.title,
            item.description,
            item.imageMediaId ? `media:${item.imageMediaId}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        )
        .join("\n"),
    );
    setExperienceSummary(profile.data.experienceSummary ?? "");
    setExperience(
      profile.data.experience
        .map((item) =>
          [item.title, item.organization, item.period, item.description]
            .filter(Boolean)
            .join(" | "),
        )
        .join("\n"),
    );
    setFaqs(
      profile.data.faqs
        .map((item) => `${item.question} | ${item.answer}`)
        .join("\n"),
    );
    const currentPhone = profile.data.contact.phone;
    setPhone(typeof currentPhone === "string" ? currentPhone : "");
  }, [profile.data]);

  useEffect(() => {
    if (coachSports.data) {
      // The saved sports provide the initial selection of this edit form.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSportIds(coachSports.data.items.map((item) => item.sportId));
    }
  }, [coachSports.data]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await Promise.all([
        (async () => {
          const trainingStyleRows = parseRows(trainingStyles, 2);
          const preparedTrainingStyles = await Promise.all(
            trainingStyleRows.map(async ([title, description, image]) => {
              const existingMediaId = image?.startsWith("media:")
                ? image.slice("media:".length)
                : undefined;
              const created = image && !existingMediaId
                ? await createMedia.mutateAsync(image)
                : undefined;
              return {
                title,
                description,
                ...((existingMediaId || created?.id)
                  ? { imageMediaId: existingMediaId ?? created!.id }
                  : {}),
              };
            }),
          );
          const createdPortfolio = await Promise.all(
            portfolioUrls
              .split("\n")
              .map((url) => url.trim())
              .filter(Boolean)
              .map((url) => createMedia.mutateAsync(url)),
          );
          return update.mutateAsync({
            displayName,
            shortBio,
            bio,
            experienceYears,
            languages: languages
              .split(/[،,]/)
              .map((item) => item.trim())
              .filter(Boolean),
            serviceModes,
            contact: phone ? { phone } : {},
            specialties: parseRows(specialties, 2).map(
              ([title, description]) => ({ title, description }),
            ),
            trainingStyles: preparedTrainingStyles,
            experienceSummary,
            experience: parseRows(experience, 1).map(
              ([title, organization, period, description]) => ({
                title,
                ...(organization ? { organization } : {}),
                ...(period ? { period } : {}),
                ...(description ? { description } : {}),
              }),
            ),
            faqs: parseRows(faqs, 2).map(([question, answer]) => ({
              question,
              answer,
            })),
            galleryMediaIds: [
              ...profile.data!.galleryMediaIds,
              ...createdPortfolio.map((item) => item.id),
            ],
          });
        })(),
        replaceSports.mutateAsync(sportIds),
      ]);
      toast.success("پروفایل حرفه‌ای ذخیره شد");
    } catch {
      toast.danger("ذخیره پروفایل ناموفق بود");
    }
  };

  if (profile.isLoading) return <FormPageSkeleton fields={7} />;
  return (
    <main className="min-h-dvh px-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader
        title="پروفایل حرفه‌ای"
        description="اطلاعاتی که ورزشکاران در صفحه مربی می‌بینند."
      />
      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="نام نمایشی">
            <input
              required
              minLength={2}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="معرفی کوتاه">
            <input
              required
              value={shortBio}
              onChange={(event) => setShortBio(event.target.value)}
              className={input}
            />
          </Field>
          <Field label="درباره من">
            <textarea
              required
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className={`${input} min-h-36 py-3`}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="سال تجربه">
              <input
                type="number"
                min={0}
                max={80}
                value={experienceYears}
                onChange={(event) =>
                  setExperienceYears(Number(event.target.value))
                }
                className={input}
              />
            </Field>
            <Field label="تلفن عمومی">
              <input
                dir="ltr"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={input}
              />
            </Field>
          </div>
          <Field label="زبان‌ها">
            <input
              value={languages}
              onChange={(event) => setLanguages(event.target.value)}
              className={input}
              placeholder="فارسی، انگلیسی"
            />
          </Field>
          <Field label="رشته‌های ورزشی">
            <div className="flex flex-wrap gap-2">
              {sportsCatalog.isPending || coachSports.isPending
                ? Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-8 w-20 rounded-full" />
                  ))
                : null}
              {(sportsCatalog.data?.items ?? []).map((sport) => (
                <Button
                  key={sport.id}
                  type="button"
                  size="sm"
                  variant={
                    sportIds.includes(sport.id) ? "primary" : "secondary"
                  }
                  onPress={() =>
                    setSportIds((items) =>
                      items.includes(sport.id)
                        ? items.filter((item) => item !== sport.id)
                        : [...items, sport.id],
                    )
                  }
                >
                  {sport.name}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="شیوه ارائه">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "club", label: "باشگاه" },
                { value: "online", label: "آنلاین" },
                { value: "home", label: "منزل" },
                { value: "outdoor", label: "فضای باز" },
              ].map((mode) => (
                <Button
                  key={mode.value}
                  type="button"
                  size="sm"
                  variant={
                    serviceModes.includes(mode.value) ? "primary" : "secondary"
                  }
                  onPress={() =>
                    setServiceModes((items) =>
                      items.includes(mode.value)
                        ? items.filter((item) => item !== mode.value)
                        : [...items, mode.value],
                    )
                  }
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </Field>
          <Field label="تخصص‌ها و توضیح">
            <textarea
              value={specialties}
              onChange={(event) => setSpecialties(event.target.value)}
              className={`${input} min-h-28 py-3`}
              placeholder="کاهش وزن | برنامه شخصی‌سازی‌شده بر اساس شرایط بدنی"
            />
          </Field>
          <Field label="سبک‌های تمرینی">
            <textarea
              value={trainingStyles}
              onChange={(event) => setTrainingStyles(event.target.value)}
              className={`${input} min-h-32 py-3`}
              placeholder="تمرین قدرتی دقیق | تمرکز بر فرم و پیشرفت تدریجی | https://example.com/style.jpg"
            />
            <p className="mt-1 text-xs leading-6 text-muted">
              هر خط: عنوان | توضیح | آدرس تصویر (اختیاری)
            </p>
          </Field>
          <Field label="افزودن تصاویر نمونه‌کار">
            <textarea
              value={portfolioUrls}
              onChange={(event) => setPortfolioUrls(event.target.value)}
              className={`${input} min-h-24 py-3`}
              dir="ltr"
              placeholder="https://example.com/result-1.jpg\nhttps://example.com/result-2.jpg"
            />
          </Field>
          <Field label="سوابق حرفه‌ای">
            <textarea
              value={experienceSummary}
              onChange={(event) => setExperienceSummary(event.target.value)}
              className={`${input} mb-3 min-h-24 py-3`}
              placeholder="خلاصه‌ای از سال‌ها و زمینه تجربه حرفه‌ای شما"
            />
            <textarea
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
              className={`${input} min-h-28 py-3`}
              placeholder="مربی ارشد | باشگاه نمونه | ۱۴۰۰ تا امروز | شرح کوتاه"
            />
          </Field>
          <Field label="سوالات متداول">
            <textarea
              value={faqs}
              onChange={(event) => setFaqs(event.target.value)}
              className={`${input} min-h-28 py-3`}
              placeholder="آیا جلسه آنلاین دارید؟ | بله، با هماهنگی قبلی."
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isPending={
              update.isPending ||
              replaceSports.isPending ||
              createMedia.isPending
            }
          >
            ذخیره پروفایل
          </Button>
        </form>
      </Card>
    </main>
  );
}

function parseRows(value: string, minimumParts: number) {
  return value
    .split("\n")
    .map((row) => row.split("|").map((part) => part.trim()))
    .filter(
      (parts) =>
        parts.length >= minimumParts &&
        parts.slice(0, minimumParts).every(Boolean),
    );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <Typography type="body-sm" weight="bold">
        {label}
      </Typography>
      {children}
    </label>
  );
}
