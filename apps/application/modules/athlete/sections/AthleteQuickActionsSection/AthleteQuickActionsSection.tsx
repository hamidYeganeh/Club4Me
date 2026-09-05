import Link from "next/link";
import { Icon, type IconName } from "@theme/icon";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: IconName;
  featured?: boolean;
};

const actions: QuickAction[] = [
  {
    href: "/discovery/search",
    title: "ورزش مناسب خودت را پیدا کن",
    description: "بین باشگاه‌ها، مربی‌ها و کلاس‌های فعال جست‌وجو کن.",
    icon: "magnifying-glass",
    featured: true,
  },
  {
    href: "/discovery/map",
    title: "اطراف من",
    description: "گزینه‌های نزدیک را روی نقشه ببین.",
    icon: "map-trifold",
  },
  {
    href: "/athlete/reservations",
    title: "برنامه من",
    description: "رزروها و زمان جلساتت را مرور کن.",
    icon: "calendar-heart",
  },
];

export function AthleteQuickActionsSection() {
  return (
    <section
      className="app-reveal flex flex-col gap-4"
      aria-labelledby="athlete-quick-actions-title"
    >
      <div>
        <h2
          id="athlete-quick-actions-title"
          className="text-xl leading-7 font-bold"
        >
          شروع سریع
        </h2>
        <p className="mt-1 text-xs text-muted">
          از همین‌جا به کارهای اصلی دسترسی داشته باش.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={
              action.featured
                ? "group col-span-2 flex min-h-32 items-center gap-4 overflow-hidden rounded-[1.35rem] border border-accent/25 bg-accent/12 p-5 text-foreground shadow-[0_14px_34px_color-mix(in_oklch,var(--accent)_10%,transparent)] transition-transform duration-300 active:scale-[0.985]"
                : "app-card group flex min-h-40 flex-col justify-between p-4 text-foreground"
            }
          >
            <span
              className={
                action.featured
                  ? "grid size-14 shrink-0 place-items-center rounded-[1.1rem] bg-accent text-accent-foreground"
                  : "grid size-11 place-items-center rounded-[1rem] bg-surface-secondary text-accent"
              }
            >
              <Icon name={action.icon} size={action.featured ? 25 : 21} />
            </span>

            <span className={action.featured ? "min-w-0 flex-1" : "mt-5"}>
              <strong className="block text-sm leading-6 font-bold">
                {action.title}
              </strong>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {action.description}
              </span>
            </span>

            <Icon
              name="chevron-left"
              size={17}
              className={
                action.featured
                  ? "shrink-0 text-accent"
                  : "mt-4 self-end text-muted transition-transform duration-300 group-hover:-translate-x-1"
              }
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
