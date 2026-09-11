import styles from "./next-action-card.module.css";
import Link from "@/components/app-link";
import { Icon, type IconName } from "@theme/icon";

export function NextActionCard({
  eyebrow,
  title,
  description,
  href,
  action,
  icon = "calendar-check",
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  action: string;
  icon?: IconName;
}) {
  return (
    <section className={styles.card} aria-label={eyebrow}>
      <div aria-hidden="true" className={styles.image} />
      <div aria-hidden="true" className={styles.scrim} />
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-white/80">{eyebrow}</p>
        <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15">
          <Icon name={icon} size={22} />
        </span>
      </div>
      <h2 className="text-xl font-bold leading-9 text-white sm:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-7 text-white/80">
        {description}
      </p>
      <Link
        href={href}
        className="mt-6 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        <span>{action}</span>
        <Icon name="arrow-left" size={20} />
      </Link>
    </section>
  );
}
