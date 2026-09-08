"use client";

import { DetailSocialSection } from "./DetailSocialSection";
import { RelatedClasses } from "./RelatedContent";
import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import type { PublicCatalogClass } from "@api/discovery";
import { Icon, type IconName } from "@theme/icon";
import { SectionHeading } from "@ui/section-heading";
import { ButtonLink } from "@/components/button-link";
import { DiscoveryImageHero } from "./DiscoveryImageHero";
import { DiscoveryPageHeader } from "./DiscoveryPageHeader";

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Tehran",
  });

export function ClassDetailLayout({
  item,
  remaining,
  registrationOpen,
  galleryHref,
  actionLabel,
  onAction,
  actionDisabled,
  actionPending,
  children,
}: {
  item: PublicCatalogClass;
  remaining: number;
  registrationOpen: boolean;
  galleryHref: string;
  actionLabel: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionPending?: boolean;
  children: ReactNode;
}) {
  const filled =
    item.capacity > 0
      ? Math.min(100, Math.max(0, (item.enrollmentCount / item.capacity) * 100))
      : 0;
  const currency = item.price.currency === "IRR" ? "ریال" : item.price.currency;
  return (
    <main className="class-detail min-h-dvh w-full min-w-0 pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader title="جزئیات کلاس" />
      <div className="flex flex-col gap-8 px-4 pt-4">
        <section
          aria-labelledby="class-title"
          className="overflow-hidden rounded-[2rem] bg-surface"
        >
          <DiscoveryImageHero
            imageUrl={item.imageUrl}
            title={item.title}
            titleId="class-title"
            eyebrow={registrationOpen ? "ثبت‌نام باز است" : "ثبت‌نام بسته است"}
            description={
              item.deliveryMode === "online"
                ? "آموزش آنلاین · دوره ورزشی"
                : "تمرین حضوری · دوره ورزشی"
            }
          >
            <ButtonLink
              href={galleryHref}
              size="sm"
              variant="secondary"
              className="mt-4 border border-white/30 bg-black/50 text-white"
            >
              <Icon name="image-1" size={18} /> گالری کلاس
            </ButtonLink>
          </DiscoveryImageHero>
          <div className="p-5 sm:p-6">
            <div className="mt-5 flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold">
                {remaining.toLocaleString("fa-IR")} جای خالی
              </span>
              <span className="text-muted">
                ظرفیت {item.capacity.toLocaleString("fa-IR")} نفر
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="ظرفیت ثبت‌نام‌شده"
              aria-valuemin={0}
              aria-valuemax={item.capacity || 1}
              aria-valuenow={Math.min(
                item.capacity,
                Math.max(0, item.enrollmentCount),
              )}
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-tertiary"
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${filled}%` }}
              />
            </div>
          </div>
        </section>

        <section aria-label="مشخصات دوره" className="grid grid-cols-2 gap-3">
          <ClassFact
            icon="calendar-1"
            label="شروع دوره"
            value={dateLabel(item.courseStartAt)}
          />
          <ClassFact
            icon="calendar-heart"
            label="پایان دوره"
            value={dateLabel(item.courseEndAt)}
          />
          <ClassFact
            icon="map-pin-1"
            label="نحوه برگزاری"
            value={item.deliveryMode === "online" ? "آنلاین" : "حضوری"}
          />
          <ClassFact
            icon="ticket"
            label="شرکت‌کنندگان"
            value={`${item.enrollmentCount.toLocaleString("fa-IR")} نفر`}
          />
        </section>

        <section aria-labelledby="class-about" className="space-y-3">
          <SectionHeading id="class-about" title="درباره این کلاس" />
          <p className="text-sm leading-8 text-muted">
            {item.description || "توضیحات این کلاس به‌زودی تکمیل می‌شود."}
          </p>
        </section>
        {children}
        <DetailSocialSection items={item.socialMedia} />
        <RelatedClasses
          excludeId={item.id}
          params={{ sportId: item.sportId }}
        />
      </div>
      <aside
        aria-label="ثبت‌نام کلاس"
        className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-3 rounded-t-[2rem] border-t border-border bg-background px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_#0000000d]"
      >
        <div className="min-w-0">
          <p className="mb-1 text-xs text-muted">شهریه دوره</p>
          <p className="text-lg font-extrabold tabular-nums">
            {item.price.amount > 0
              ? item.price.amount.toLocaleString("fa-IR")
              : "رایگان"}
            {item.price.amount > 0 ? (
              <span className="ms-1 text-xs font-normal text-muted">
                {currency}
              </span>
            ) : null}
          </p>
        </div>
        <Button
          variant="primary"
          className="min-w-36 flex-1 text-sm font-bold sm:max-w-64"
          isDisabled={actionDisabled || !onAction}
          isPending={actionPending}
          onPress={onAction}
        >
          {actionLabel}
        </Button>
      </aside>
    </main>
  );
}

function ClassFact({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-3xl bg-surface p-4">
      <span className="grid size-10 place-items-center rounded-2xl bg-accent text-accent-foreground">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <p className="mb-1 text-xs text-muted">{label}</p>
        <p className="text-sm leading-6 font-bold">{value}</p>
      </div>
    </div>
  );
}
