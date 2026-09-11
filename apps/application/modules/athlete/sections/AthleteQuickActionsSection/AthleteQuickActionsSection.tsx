import Link from "@/components/app-link";
import { Icon, type IconName } from "@theme/icon";

const actions: { href: string; title: string; icon: IconName }[] = [
  {
    href: "/athlete/recommendations",
    title: "کلاس مناسب من",
    icon: "magnifying-glass",
  },
  { href: "/discovery/map", title: "اطراف من", icon: "map-trifold" },
  { href: "/athlete/memberships", title: "عضویت‌ها", icon: "ticket" },
  { href: "/athlete/packages", title: "بسته‌های مربی", icon: "users-two" },
];

export function AthleteQuickActionsSection() {
  return (
    <nav aria-label="دسترسی سریع" className="grid grid-cols-4 gap-2">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-surface p-2 text-center transition hover:bg-surface-secondary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-accent/8 text-accent">
            <Icon name={action.icon} size={23} />
          </span>
          <span className="text-xs font-semibold leading-5">
            {action.title}
          </span>
        </Link>
      ))}
    </nav>
  );
}
