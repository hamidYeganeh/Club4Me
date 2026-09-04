"use client";

import { Button, Card, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

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
  favorited,
  onSelect,
  onToggleFavorite,
  onCancel,
  cancelPending,
  peopleLabel,
  durationLabel,
  statusLabel,
  favoriteLabel,
  unfavoriteLabel,
  cancelLabel,
}: {
  item: TimelineReservation;
  selected: boolean;
  favorited: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCancel: (id: string) => void;
  cancelPending: boolean;
  peopleLabel: string;
  durationLabel: string;
  statusLabel: string;
  favoriteLabel: string;
  unfavoriteLabel: string;
  cancelLabel: string;
}) {
  const styles = reservationTimelineRowStyles({ selected, favorited });
  const canCancel = item.status === "reserved";
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

      {selected ? (
        <div className={styles.actions()}>
          {canCancel ? (
            <Button
              isIconOnly
              variant="primary"
              aria-label={cancelLabel}
              isPending={cancelPending}
              className={styles.action()}
              onPress={() => onCancel(item.id)}
            >
              <Icon name="calendar-plus" size={18} />
            </Button>
          ) : (
            <Button
              isIconOnly
              variant="primary"
              aria-label={statusLabel}
              isDisabled
              className={styles.action()}
            >
              <Icon name="calendar-check" size={18} />
            </Button>
          )}
          <Button
            isIconOnly
            variant="secondary"
            aria-label={favorited ? unfavoriteLabel : favoriteLabel}
            aria-pressed={favorited}
            className={`${styles.action()} ${styles.favorite()}`}
            onPress={() => onToggleFavorite(item.id)}
          >
            <Icon name="bookmark" size={18} />
          </Button>
        </div>
      ) : null}
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
          {items.map((item) => (
            <ReservationTimelineRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              favorited={favoriteIds.has(item.id)}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
              onCancel={onCancel}
              cancelPending={cancelPending}
              peopleLabel={peopleLabel(item.participantCount)}
              durationLabel={durationLabel(
                durationMinutes(item.sessionStartsAt, item.sessionEndsAt),
              )}
              statusLabel={statusLabel(item.status)}
              favoriteLabel={favoriteLabel}
              unfavoriteLabel={unfavoriteLabel}
              cancelLabel={cancelLabel}
            />
          ))}
        </div>
      )}
    </section>
  );
}
