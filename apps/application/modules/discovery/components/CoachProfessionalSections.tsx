import { useId, type ReactNode } from "react";
import { Card } from "@heroui/react";
import { coachLevelLabels, emptyCoachProfessionalProfile } from "@api";
import type { PublicCatalogCoach } from "@api/discovery";

export function CoachProfessionalSections({
  coach,
  section,
}: {
  coach: PublicCatalogCoach;
  section: "introduction" | "experience";
}) {
  const profile = {
    ...emptyCoachProfessionalProfile(),
    ...coach.professionalProfile,
  };
  const age =
    coach.minAcceptedAge != null && coach.maxAcceptedAge != null
      ? `${coach.minAcceptedAge.toLocaleString("fa-IR")} تا ${coach.maxAcceptedAge.toLocaleString("fa-IR")} سال`
      : coach.minAcceptedAge != null
        ? `از ${coach.minAcceptedAge.toLocaleString("fa-IR")} سال`
        : coach.maxAcceptedAge != null
          ? `تا ${coach.maxAcceptedAge.toLocaleString("fa-IR")} سال`
          : "";
  const levels = profile.levels
    .map((level) => coachLevelLabels[level])
    .filter(Boolean);
  const videoUrl = secureVideoUrl(profile.introductionVideoUrl);
  if (section === "introduction")
    return (
      <>
        {coach.bio || coach.languages?.length || videoUrl ? (
          <Section title="آشنایی با مربی">
            {coach.bio ? <Paragraph>{coach.bio}</Paragraph> : null}
            {coach.languages?.length ? (
              <p className="text-sm leading-7">
                <span className="font-bold">زبان‌های آموزش: </span>
                {coach.languages.join("، ")}
              </p>
            ) : null}
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-xl bg-accent/12 px-4 text-sm font-bold text-accent focus-visible:outline-2"
              >
                مشاهده ویدئوی معرفی و آموزش ↗
              </a>
            ) : null}
          </Section>
        ) : null}
        {profile.audience ||
        profile.goals.length ||
        levels.length ||
        age ||
        profile.prerequisites ? (
          <Section title="این مربی برای چه کسی مناسب است؟">
            {profile.audience ? (
              <Paragraph>{profile.audience}</Paragraph>
            ) : null}
            {profile.goals.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.goals.map((goal, index) => (
                  <span
                    key={`${goal}-${index}`}
                    className="rounded-full bg-accent/10 px-3 py-2 text-xs font-bold text-accent"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            ) : null}
            {levels.length || age ? (
              <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-secondary p-4">
                {levels.length ? (
                  <div>
                    <dt className="text-xs text-muted">سطح شاگرد</dt>
                    <dd className="mt-2 text-sm font-bold">
                      {levels.join("، ")}
                    </dd>
                  </div>
                ) : null}
                {age ? (
                  <div>
                    <dt className="text-xs text-muted">بازه سنی</dt>
                    <dd className="mt-2 text-sm font-bold">{age}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {profile.prerequisites ? (
              <div>
                <h3 className="mb-2 text-sm font-bold">
                  پیش‌نیازها و شرایط پذیرش
                </h3>
                <Paragraph>{profile.prerequisites}</Paragraph>
              </div>
            ) : null}
          </Section>
        ) : null}
      </>
    );
  const steps = [
    ["جلسه اول", profile.firstSession],
    ["برنامه شخصی", profile.planning],
    ["همراهی بین جلسات", profile.followUp],
    ["ارزیابی پیشرفت", profile.progressTracking],
  ].filter(([, description]) => Boolean(description));
  const stories = profile.successStories.filter(
    (story) => story.consent === true,
  );
  return (
    <>
      {steps.length ? (
        <Section title="مسیر همکاری با مربی">
          <ol className="space-y-5">
            {steps.map(([title, description], index) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-sm font-bold text-accent">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
                <div className="min-w-0">
                  <h3 className="mb-2 text-sm font-bold">{title}</h3>
                  <Paragraph>{description}</Paragraph>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
      {profile.credentials.length ? (
        <Section title="مدارک و صلاحیت‌ها">
          <p className="text-xs leading-6 text-muted">
            اطلاعات ثبت‌شده توسط مربی؛ اصالت این مدارک توسط Club4Me تأیید نشده
            است.
          </p>
          <div className="divide-y divide-border">
            {profile.credentials.map((credential, index) => (
              <article
                key={index}
                className="space-y-2 py-4 first:pt-0 last:pb-0"
              >
                <h3 className="font-bold">{credential.title}</h3>
                <p className="text-sm text-muted">
                  {credential.issuer}
                  {credential.year ? ` · دریافت ${credential.year}` : ""}
                </p>
                {credential.expiresOn ? (
                  <p className="text-xs text-muted">
                    تاریخ پایان اعتبار: {formatDate(credential.expiresOn)}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </Section>
      ) : null}
      {profile.achievements.length ? (
        <Section title="افتخارات مربی">
          {profile.achievements.map((item, index) => (
            <article key={index} className="border-s-2 border-accent/40 ps-4">
              <h3 className="text-sm font-bold">{item.title}</h3>
              {item.organization || item.year ? (
                <p className="mt-2 text-sm text-muted">
                  {[item.organization, item.year].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </article>
          ))}
        </Section>
      ) : null}
      {stories.length ? (
        <Section title="نمونه پیشرفت شاگردان">
          <p className="text-xs leading-6 text-muted">
            روایت مربی از همکاری‌های قبلی، با اعلام رضایت شاگردان برای انتشار.
          </p>
          {stories.map((story, index) => (
            <article
              key={index}
              className="space-y-3 rounded-2xl bg-surface-secondary p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{story.title}</h3>
                <span className="text-xs text-muted">{story.duration}</span>
              </div>
              <p className="text-sm leading-7">
                <span className="font-bold">هدف اولیه: </span>
                {story.goal}
              </p>
              <Paragraph>{story.outcome}</Paragraph>
            </article>
          ))}
        </Section>
      ) : null}
    </>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 px-1 text-lg font-black text-foreground">
        {title}
      </h2>
      <Card className="app-card space-y-4 p-5 shadow-none">{children}</Card>
    </section>
  );
}
function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line break-words text-sm leading-8 text-muted">
      {children}
    </p>
  );
}
function secureVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("fa-IR", { timeZone: "UTC" });
}
