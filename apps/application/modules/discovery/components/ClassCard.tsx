import Link from "@/components/app-link";
import { Icon } from "@theme/icon";
import { FallbackImage } from "@/components/FallbackImage";

export function ClassCard({
  title,
  description,
  imageUrl,
  href,
  badge,
  remaining,
  price,
  currency,
  startAt,
  variant = "default",
  className = "",
}: {
  title: string;
  description: string;
  imageUrl?: string | null;
  href: string;
  badge: string;
  remaining: number;
  price: number;
  currency: string;
  startAt?: string;
  variant?: "default" | "club";
  className?: string;
}) {
  if (variant === "club") {
    return (
      <Link
        href={href}
        aria-label={title}
        className={`class-browse-card group relative isolate aspect-[1.46/1] overflow-hidden rounded-[2rem] bg-surface p-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 ${className}`}
      >
        {imageUrl ? (
          <FallbackImage
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 576px) 84vw, 22rem"
            className="-z-20 object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          />
        ) : null}
        <span className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/75 to-background/10" />

        <span className="inline-flex items-center gap-2 rounded-xl bg-foreground/70 px-3 py-2 text-xs font-bold text-background backdrop-blur-md">
          <Icon name="academic-cap" size={18} />
          {badge}
        </span>

        <div className="absolute inset-x-4 bottom-4">
          <h2 className="line-clamp-2 text-xl leading-8 font-extrabold">
            {title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            {startAt && Number.isFinite(Date.parse(startAt)) ? (
              <span className="flex items-center gap-1.5">
                <Icon name="calendar-1" size={16} />
                {new Date(startAt).toLocaleDateString("fa-IR", {
                  day: "numeric",
                  month: "long",
                  timeZone: "Asia/Tehran",
                })}
              </span>
            ) : null}
            <span aria-hidden>•</span>
            <span>{Math.max(0, remaining).toLocaleString("fa-IR")} جای خالی</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={title}
      className={`class-browse-card group overflow-hidden rounded-[2rem] bg-surface text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-4 ${className}`}
    >
      {imageUrl ? (
        <div className="relative aspect-[16/8] overflow-hidden">
          <FallbackImage
            src={imageUrl}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
          />
          <span className="absolute start-4 top-4 rounded-full bg-background px-3 py-2 text-xs font-bold">
            {badge}
          </span>
        </div>
      ) : null}
      <div className="p-5">
        {!imageUrl ? (
          <p className="mb-3 inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
            <Icon name="academic-cap" size={18} />
            {badge}
          </p>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg leading-8 font-extrabold">{title}</h2>
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-secondary"
            aria-hidden
          >
            <Icon name="arrow-left" size={18} />
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-7 text-muted">
          {description}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
          {startAt && Number.isFinite(Date.parse(startAt)) ? (
            <span className="flex items-center gap-1.5">
              <Icon name="calendar-1" size={16} />
              {new Date(startAt).toLocaleDateString("fa-IR", {
                day: "numeric",
                month: "long",
                timeZone: "Asia/Tehran",
              })}
            </span>
          ) : null}
          <span>{Math.max(0, remaining).toLocaleString("fa-IR")} جای خالی</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <span className="text-sm font-extrabold">
            {price > 0 ? price.toLocaleString("fa-IR") : "رایگان"}
            {price > 0 ? (
              <span className="ms-1 text-xs font-normal text-muted">
                {currency === "IRR" ? "ریال" : currency}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-semibold">مشاهده کلاس</span>
        </div>
      </div>
    </Link>
  );
}
