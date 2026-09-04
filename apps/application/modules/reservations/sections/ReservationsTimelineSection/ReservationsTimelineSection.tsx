"use client";

import { Button, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { SwipeableList } from "@repo/ui/swipeable-list";

import {
  durationMinutes,
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
}: {
  item: TimelineReservation;
  selected: boolean;
  onSelect: (id: string) => void;
  peopleLabel: string;
  durationLabel: string;
  statusLabel: string;
}) {
  const styles = reservationTimelineRowStyles({ selected });
  const secondMeta = item.status === "reserved" ? durationLabel : statusLabel;

  return (
    <div className={styles.root()}>
      {selected ? null : (
        <Chip size="sm" className={styles.time()}>
          <Icon name="clock" size={12} className={styles.timeIcon()} />
          <Chip.Label>{formatReservationTime(item.sessionStartsAt)}</Chip.Label>
        </Chip>
      )}

      <Card variant="transparent" className={styles.card()}>
        <Button
          variant="ghost"
          className="h-auto min-h-0 min-w-0 flex-1 justify-start gap-3 rounded-[inherit] p-0 text-start hover:bg-transparent"
          onPress={() => onSelect(item.id)}
        >
          <span className={styles.iconBox()} aria-hidden>
            <Icon name={reservationIcon(item.sessionTitle)} size={22} />
          </span>
          <div className={styles.body()}>
            <Typography type="h6" className={styles.name()}>
              {item.sessionTitle}
            </Typography>
            <div className={styles.meta()}>
              <span className={styles.metaItem()}>
                <Icon
                  name="users-two"
                  size={13}
                  className={styles.metaAccent()}
                />
                {peopleLabel}
              </span>
              <span className={styles.metaItem()}>
                <Icon name="clock" size={13} className={styles.metaMuted()} />
                {secondMeta}
              </span>
              <span className={styles.metaItem()}>
                {paymentStatusLabel(item.paymentStatus)}
              </span>
            </div>
          </div>
        </Button>
      </Card>

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
  isPending,
  emptyLabel,
  selectedId,
  onSelect,
  favoriteIds,
  onToggleFavorite,
  onCancel,
  cancelPending,
  peopleLabel,
  durationLabel,
  statusLabel,
  favoriteLabel,
  unfavoriteLabel,
  cancelLabel,
}: ReservationsTimelineSectionProps) {
  const styles = reservationsTimelineSectionStyles();

  return (
    <section className={styles.root()}>
      <div className={styles.toolbar()}>
        <Typography type="h5" className={styles.title()}>
          {title}
        </Typography>
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
      </div>

      {isPending ? (
        <div className={styles.list()}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className={styles.skeleton()} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty()}>{emptyLabel}</p>
      ) : (
        <div className={styles.list()}>
          <span aria-hidden className={styles.line()} />
          <SwipeableList
            className="gap-5"
            itemClassName="rounded-[1.35rem] bg-surface-secondary"
            surfaceClassName="rounded-[1.35rem] bg-background"
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
                />
              ),
              leftActions: [
                {
                  id: "favorite",
                  label: favoriteIds.has(item.id)
                    ? unfavoriteLabel
                    : favoriteLabel,
                  icon: <Icon name="bookmark" size={19} />,
                  className: favoriteIds.has(item.id)
                    ? "bg-accent text-accent-foreground"
                    : "bg-foreground text-background",
                  onClick: () => onToggleFavorite(item.id),
                },
              ],
              rightActions: [
                {
                  id: "cancel",
                  label: item.status === "reserved" ? cancelLabel : statusLabel(item.status),
                  icon: (
                    <Icon
                      name={item.status === "reserved" ? "calendar-plus" : "calendar-check"}
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
