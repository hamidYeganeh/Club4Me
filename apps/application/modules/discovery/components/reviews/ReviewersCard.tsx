import Link from "@/components/app-link";
import { Card } from "@heroui/react";
import { Icon } from "@theme/icon";

export function ReviewersCard({
  count,
  href,
}: {
  count: number;
  href: string;
}) {
  return (
    <section className="app-reveal">
      <h2 className="mb-3 px-1 text-lg font-black text-foreground">
        کسانی که امتیاز داده‌اند
      </h2>
      <Link
        href={href}
        className="block rounded-[1.35rem] outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <Card className="app-card app-stack-card p-5 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <div
              className="flex -space-x-3 space-x-reverse"
              dir="rtl"
              aria-hidden
            >
              {!count ? (
                <span className="flex size-11 items-center justify-center rounded-full border-2 border-surface bg-accent/12 text-accent">
                  <Icon name="star-full" size={18} />
                </span>
              ) : null}
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
              <Icon name="chevron-left" size={19} />
            </span>
          </div>
          <p className="mt-5 text-lg font-black text-foreground">
            {count
              ? `${count.toLocaleString("fa-IR")} نفر امتیاز داده‌اند`
              : "اولین امتیاز را شما ثبت کنید"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted">
            تجربه‌تان را ثبت کنید و به انتخاب بهتر دیگران کمک کنید.
          </p>
        </Card>
      </Link>
    </section>
  );
}
