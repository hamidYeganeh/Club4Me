"use client";

import { usePublicClubClasses } from "@api";
import Link from "next/link";

export function ClubCoachesContextSection({
  clubId,
  timezone,
}: {
  clubId: string;
  timezone: string;
}) {
  const classes = usePublicClubClasses({ clubId });
  const items = classes.data?.items ?? [];
  const coaches = [
    ...new Map(
      items.flatMap((item) =>
        item.coach ? [[item.coach.id, item.coach] as const] : [],
      ),
    ).values(),
  ];
  if (classes.isPending)
    return (
      <p className="px-5 pb-6 text-sm text-muted">
        در حال دریافت مربی‌های باشگاه…
      </p>
    );
  if (classes.isError)
    return (
      <div className="px-5 pb-6 text-sm">
        دریافت مربی‌ها انجام نشد.{" "}
        <button type="button" onClick={() => void classes.refetch()}>
          تلاش دوباره
        </button>
      </div>
    );
  if (!coaches.length) return null;
  return (
    <section className="mx-auto w-full max-w-4xl space-y-3 px-5 pb-8">
      <h2 className="text-xl font-bold">مربی‌ها در این باشگاه</h2>
      <p className="text-xs text-muted">
        بر اساس کلاس‌ها و جلسات منتشرشده این باشگاه
      </p>
      {coaches.map((coach) => {
        const teaching = items.filter((item) => item.coach?.id === coach.id);
        return (
          <article
            key={coach.id}
            className="space-y-3 rounded-2xl bg-surface-secondary p-4"
          >
            <h3 className="font-bold">{coach.name}</h3>
            {Boolean(coach.verifiedCredentialsCount) && (
              <p className="text-xs text-success">
                {coach.verifiedCredentialsCount} رشته با مدارک بررسی‌شده در
                پروفایل مربی
              </p>
            )}
            {coach.profileSlug && (
              <Link
                className="text-sm text-accent"
                href={`/discovery/coaches/${coach.profileSlug}`}
              >
                مشاهده پروفایل مربی
              </Link>
            )}
            {teaching.map((item) => {
              const days = [
                ...new Set(
                  item.sessions.map((session) =>
                    new Intl.DateTimeFormat("fa-IR", {
                      weekday: "long",
                      timeZone: timezone,
                    }).format(new Date(session.startsAt)),
                  ),
                ),
              ];
              return (
                <div
                  key={item.id}
                  className="border-t border-border pt-3 text-sm"
                >
                  <p>
                    {item.sport || item.title} · سطح:{" "}
                    {item.level || "اعلام نشده"} ·{" "}
                    {item.model === "private"
                      ? "خصوصی"
                      : item.model === "group"
                        ? "گروهی"
                        : item.model === "course"
                          ? "دوره آموزشی"
                          : item.model === "single"
                            ? "تک‌جلسه"
                            : "تمرین آزاد"}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    روزهای جلسات پیش رو:{" "}
                    {days.length ? days.join("، ") : "هنوز اعلام نشده"}
                  </p>
                  <Link
                    href={`/discovery/business-class?classId=${item.id}`}
                    className="mt-2 inline-block text-accent"
                  >
                    مشاهده زمان‌ها و ثبت‌نام {item.title}
                  </Link>
                </div>
              );
            })}
          </article>
        );
      })}
    </section>
  );
}
