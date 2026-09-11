"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "@/components/app-link";
import { Button, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { RequestFailureState } from "@/components/request-failure-state";
import {
  SortBottomSheet,
  type SortOption,
} from "@/components/sort-bottom-sheet";

import {
  durationMinutes,
  formatReservationDate,
  formatReservationTime,
  reservationIcon,
} from "../../reservations.utils";
import type { TimelineReservation } from "../../reservations.types";
import {
  reservationTimelineRowStyles,
  reservationsTimelineSectionStyles,
} from "./ReservationsTimelineSection.styles";
import type { ReservationsTimelineSectionProps } from "./ReservationsTimelineSection.types";

function ReservationTimelineRow({
  item,
  selected,
  onSelect,
  peopleLabel,
  durationLabel,
  statusLabel,
  historyMode,
  onCancel,
  cancelPending,
}: {
  item: TimelineReservation;
  selected: boolean;
  onSelect: (id: string) => void;
  peopleLabel: string;
  durationLabel: string;
  statusLabel: string;
  historyMode: boolean;
  onCancel: (id: string) => void;
  cancelPending: boolean;
}) {
  const styles = reservationTimelineRowStyles({ selected });
  return (
    <div className={styles.root()}>
      <div className={styles.card()}>
        <Button
          variant="ghost"
          className={styles.cardButton()}
          onPress={() => onSelect(item.id)}
        >
          <span className={styles.iconBox()} aria-hidden>
            <Icon name={reservationIcon(item)} size={22} />
          </span>
          <div className={styles.body()}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={styles.status()}>{statusLabel}</span>
              <span className="text-xs font-semibold tabular-nums text-muted">
                {historyMode
                  ? `${formatReservationDate(item.sessionStartsAt)} · `
                  : ""}
                {formatReservationTime(item.sessionStartsAt)}
              </span>
            </div>
            <Typography type="h6" className={styles.name()}>
              {item.sessionTitle}
            </Typography>
            <div className={styles.meta()}>
              <span className={styles.metaItem()}>
                <Icon
                  name="users-two"
                  size={15}
                  className={styles.metaAccent()}
                />
                <strong>{peopleLabel}</strong>
              </span>
              <span className={styles.metaDivider()} aria-hidden />
              <span className={styles.metaItem()}>
                <Icon name="clock" size={15} className={styles.metaMuted()} />
                <strong>
                  {item.source === "class"
                    ? `تا ${formatReservationDate(item.sessionEndsAt)}`
                    : durationLabel}
                </strong>
              </span>
              <span className={styles.metaDivider()} aria-hidden />
              <span className={styles.metaItem()}>
                <Icon name="wallet" size={15} className={styles.metaAccent()} />
                <strong>{paymentStatusLabel(item.paymentStatus)}</strong>
              </span>
            </div>
          </div>
        </Button>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-xs font-semibold text-muted">
            {item.source === "class"
              ? "دوره ورزشی"
              : item.source === "coach"
                ? "جلسه با مربی"
                : "رزرو باشگاه"}
          </span>
          {item.status === "reserved" ? (
            <Button
              size="sm"
              variant="ghost"
              className="min-h-11 px-2 text-xs text-danger"
              aria-label={`لغو ${item.sessionTitle}`}
              isDisabled={cancelPending}
              onPress={() => onCancel(item.id)}
            >
              لغو رزرو
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function paymentStatusLabel(status: TimelineReservation["paymentStatus"]) {
  const labels = {
    not_required: "رایگان",
    pending: "در انتظار پرداخت",
    paid: "پرداخت‌شده",
    refunded: "بازپرداخت‌شده",
    failed: "پرداخت ناموفق",
  } satisfies Record<TimelineReservation["paymentStatus"], string>;
  return labels[status];
}

export function ReservationsTimelineSection({
  title,
  newestFirstLabel,
  oldestFirstLabel,
  sortNewestFirst,
  onToggleSort,
  items,
  historyMode,
  isPending,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  exploreLabel,
  exploreHref,
  selectedId,
  onSelect,
  renewLabel,
  onRenew,
  onCancel,
  cancelPending,
  peopleLabel,
  durationLabel,
  statusLabel,
}: ReservationsTimelineSectionProps) {
  const styles = reservationsTimelineSectionStyles();
  const [sortOpen, setSortOpen] = useState(false);
  const sortValue = sortNewestFirst ? "newest" : "oldest";
  const sortOptions: ReadonlyArray<SortOption<"newest" | "oldest">> = [
    {
      value: "newest",
      label: newestFirstLabel,
      icon: "sort-descending",
    },
    {
      value: "oldest",
      label: oldestFirstLabel,
      icon: "sort-ascending",
    },
  ];

  return (
    <section className={styles.root()}>
      {isPending || items.length > 0 ? (
        <div className={styles.toolbar()}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.sort()}
            onPress={() => setSortOpen(true)}
          >
            {sortNewestFirst ? newestFirstLabel : oldestFirstLabel}
            <Icon
              name={sortNewestFirst ? "sort-descending" : "sort-ascending"}
              size={16}
              className={styles.sortIcon()}
            />
          </Button>
          <Typography type="h5" className={styles.title()}>
            {title}
          </Typography>
        </div>
      ) : null}

      {isPending ? (
        <div
          className={styles.list()}
          aria-busy="true"
          aria-label="در حال بارگذاری رزروها"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="relative flex min-h-[7.5rem] items-center gap-3"
            >
              <div className="flex w-[4.1rem] shrink-0 justify-center">
                <Skeleton className="h-8 w-14 rounded-[0.7rem]" />
              </div>
              <div className="app-card flex min-w-0 flex-1 items-start gap-3 rounded-[1.25rem] p-4">
                <Skeleton className="size-12 shrink-0 rounded-[0.9rem]" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <Skeleton className="h-3 w-20 rounded-lg" />
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-3 w-16 rounded-lg" />
                    <Skeleton className="h-3 w-20 rounded-lg" />
                    <Skeleton className="h-3 w-16 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <RequestFailureState error={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <div className={styles.empty()}>
          <div className={styles.emptyVisual()} aria-hidden>
            <span className={styles.emptyGlow()} />
            <Image
              src="/reservations-empty-stopwatch.png"
              alt=""
              width={512}
              height={512}
              className={styles.emptyImage()}
              priority
            />
          </div>
          <div className={styles.emptyCopy()}>
            <Typography type="h3" className={styles.emptyTitle()}>
              {emptyTitle}
            </Typography>
            <p className={styles.emptyDescription()}>{emptyDescription}</p>
          </div>
          <Link href={exploreHref} className={styles.explore()}>
            {exploreLabel}
            <Icon name="magnifying-glass" size={22} />
          </Link>
        </div>
      ) : (
        <div className={styles.list()}>
          <span aria-hidden className={styles.line()} />
          {items.map((item) => (
            <div key={item.id}>
              <ReservationTimelineRow
                item={item}
                selected={selectedId === item.id}
                onSelect={onSelect}
                peopleLabel={peopleLabel(item.participantCount)}
                durationLabel={durationLabel(
                  durationMinutes(item.sessionStartsAt, item.sessionEndsAt),
                )}
                statusLabel={statusLabel(item.status)}
                historyMode={historyMode}
                onCancel={onCancel}
                cancelPending={cancelPending}
              />
              {item.status !== "reserved" ? (
                <Button
                  variant="secondary"
                  className="mt-2 min-h-11 w-full"
                  onPress={() => onRenew(item)}
                >
                  {renewLabel}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <SortBottomSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        value={sortValue}
        onApply={(nextValue) => {
          if (nextValue !== sortValue) onToggleSort();
        }}
        title="مرتب‌سازی رزروها"
        description="رزروها را از جدیدترین یا قدیمی‌ترین مورد نمایش دهید."
        options={sortOptions}
      />
    </section>
  );
}
