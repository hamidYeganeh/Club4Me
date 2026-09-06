import { Card, Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

type ReviewTarget = "club" | "coach" | "class";
type InsightMetric = "recommended" | "excellent" | "satisfied";

type InsightCopy = {
  title: string;
  description: string;
  icon: IconName;
  metric: InsightMetric;
};

const insightCopy = {
  club: [
    {
      title: "باشگاه پیشنهادی",
      description: "از ورزشکاران این باشگاه را پیشنهاد می‌کنند",
      icon: "thumbs-up",
      metric: "recommended",
    },
    {
      title: "تجربه عالی",
      description: "از کاربران بالاترین امتیاز را ثبت کرده‌اند",
      icon: "medal",
      metric: "excellent",
    },
    {
      title: "رضایت از باشگاه",
      description: "از تجربه خود در این باشگاه رضایت داشته‌اند",
      icon: "smile-happy",
      metric: "satisfied",
    },
  ],
  coach: [
    {
      title: "مربی پیشنهادی",
      description: "از ورزشکاران این مربی را پیشنهاد می‌کنند",
      icon: "thumbs-up",
      metric: "recommended",
    },
    {
      title: "عملکرد عالی",
      description: "از کاربران بالاترین امتیاز را ثبت کرده‌اند",
      icon: "medal",
      metric: "excellent",
    },
    {
      title: "رضایت از مربی",
      description: "از تجربه تمرین با این مربی رضایت داشته‌اند",
      icon: "smile-happy",
      metric: "satisfied",
    },
  ],
  class: [
    {
      title: "کلاس پیشنهادی",
      description: "از شرکت‌کنندگان این کلاس را پیشنهاد می‌کنند",
      icon: "thumbs-up",
      metric: "recommended",
    },
    {
      title: "تجربه عالی",
      description: "از کاربران بالاترین امتیاز را ثبت کرده‌اند",
      icon: "medal",
      metric: "excellent",
    },
    {
      title: "رضایت از کلاس",
      description: "از شرکت در این کلاس رضایت داشته‌اند",
      icon: "smile-happy",
      metric: "satisfied",
    },
  ],
} satisfies Record<ReviewTarget, InsightCopy[]>;

function toPercentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function ReviewSummary({
  type,
  average,
  count,
  distribution,
}: {
  type: ReviewTarget;
  average: number;
  count: number;
  /** Counts ordered from five stars down to one star. */
  distribution?: number[];
}) {
  const ratings = Array.from(
    { length: 5 },
    (_, index) => Math.max(0, distribution?.[index] ?? 0),
  );
  const ratedCount = ratings.reduce((total, value) => total + value, 0);
  const displayedCount = Math.max(count, ratedCount);
  const metrics: Record<InsightMetric, number> = {
    recommended: toPercentage(ratings[0] + ratings[1], ratedCount),
    excellent: toPercentage(ratings[0], ratedCount),
    satisfied: toPercentage(ratings[0] + ratings[1] + ratings[2], ratedCount),
  };

  return (
    <section className="app-reveal" aria-labelledby="review-summary-title">
      <h2
        id="review-summary-title"
        className="mb-3 px-1 text-lg font-black text-foreground"
      >
        خلاصه امتیازها
      </h2>

      <Card className="app-card overflow-hidden p-0 shadow-none">
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-4 p-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-7 sm:p-6">
          <div className="text-center">
            <Typography
              type="h1"
              weight="bold"
              className="text-5xl leading-none tabular-nums text-foreground"
            >
              {average.toLocaleString("fa-IR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
            </Typography>
            <p className="mt-3 text-sm font-black text-foreground">
              میانگین امتیاز
            </p>
            <p className="mt-1 text-xs text-muted">
              {displayedCount.toLocaleString("fa-IR")} نظر
            </p>
          </div>

          {ratedCount ? (
            <div className="min-w-0 space-y-2.5" dir="ltr">
              {ratings.map((value, index) => {
                const rating = 5 - index;
                const percentage = toPercentage(value, ratedCount);

                return (
                  <div
                    key={rating}
                    className="grid grid-cols-[12px_18px_minmax(0,1fr)_32px] items-center gap-2"
                  >
                    <span className="text-xs font-black tabular-nums text-foreground">
                      {rating}
                    </span>
                    <Icon name="star-full" size={15} className="text-accent" />
                    <div
                      className="h-2 overflow-hidden rounded-full bg-surface-tertiary"
                      role="progressbar"
                      aria-label={`${rating} ستاره`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                    >
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-end text-xs tabular-nums text-muted">
                      {value.toLocaleString("fa-IR")}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl bg-surface-secondary px-4 text-center">
              <Icon name="star-full" size={28} className="text-accent" />
              <p className="mt-2 text-xs leading-6 text-muted">
                {displayedCount
                  ? "جزئیات توزیع امتیازها هنوز در دسترس نیست"
                  : "با ثبت نظر، جزئیات امتیازها اینجا نمایش داده می‌شود"}
              </p>
            </div>
          )}
        </div>

        {ratedCount ? (
          <div className="border-t border-white/7 px-5 sm:px-6">
            {insightCopy[type].map(({ title, description, icon, metric }) => (
              <div
                key={title}
                className="flex items-center gap-4 border-b border-white/7 py-5 last:border-b-0"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                  <Icon name={icon} size={24} />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-black text-foreground">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    <span className="font-bold tabular-nums text-accent">
                      {metrics[metric].toLocaleString("fa-IR")}٪
                    </span>{" "}
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
