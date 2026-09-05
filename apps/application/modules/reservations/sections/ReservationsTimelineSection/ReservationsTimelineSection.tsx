"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SwipeableList } from "@repo/ui/swipeable-list";
import { RequestFailureState } from "@/components/request-failure-state";

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
}: {
  item: TimelineReservation;
  selected: boolean;
  onSelect: (id: string) => void;
  peopleLabel: string;
  durationLabel: string;
  statusLabel: string;
  historyMode: boolean;
}) {
  const styles = reservationTimelineRowStyles({ selected });
  return (
    <div className={styles.root()}>
      <div className={styles.timeRail()}>
        <Chip size="sm" className={styles.time()}>
          <Chip.Label className={styles.timeLabel()}>
            {historyMode ? (
              <span className={styles.timeDate()}>
                {formatReservationDate(item.sessionStartsAt)}
              </span>
            ) : null}
            <span>{formatReservationTime(item.sessionStartsAt)}</span>
          </Chip.Label>
        </Chip>
      </div>

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
            <span className={styles.status()}>{statusLabel}</span>
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
                <strong>{durationLabel}</strong>
              </span>
              <span className={styles.metaDivider()} aria-hidden />
              <span className={styles.metaItem()}>
                <Icon name="wallet" size={15} className={styles.metaAccent()} />
                <strong>{paymentStatusLabel(item.paymentStatus)}</strong>
              </span>
            </div>
          </div>
        </Button>
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
  cancelLabel,
}: ReservationsTimelineSectionProps) {
  const styles = reservationsTimelineSectionStyles();

  return (
    <section className={styles.root()}>
      {isPending || items.length > 0 ? (
        <div className={styles.toolbar()}>
          <Button
            variant="ghost"
            size="sm"
            className={styles.sort()}
            onPress={onToggleSort}
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
          <SwipeableList
            className="gap-5"
            itemClassName="rounded-[1.25rem] bg-surface-secondary"
            surfaceClassName="rounded-[1.25rem] bg-surface"
            railClassName="rounded-[1.35rem] bg-surface-secondary"
            items={items.map((item) => ({
              id: item.id,
              content: (
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
                />
              ),
              leftActions: [
                {
                  id: "renew",
                  label: renewLabel,
                  icon: <Icon name="calendar-plus" size={19} />,
                  className: "bg-accent text-accent-foreground",
                  onClick: () => onRenew(item),
                },
              ],
              rightActions: [
                {
                  id: "cancel",
                  label:
                    item.status === "reserved"
                      ? cancelLabel
                      : statusLabel(item.status),
                  icon: (
                    <Icon
                      name={
                        item.status === "reserved"
                          ? "calendar-plus"
                          : "calendar-check"
                      }
                      size={19}
                    />
                  ),
                  className: "bg-danger text-danger-foreground",
                  disabled: item.status !== "reserved" || cancelPending,
                  onClick: () => onCancel(item.id),
                },
              ],
            }))}
          />
        </div>
      )}
    </section>
  );
}
