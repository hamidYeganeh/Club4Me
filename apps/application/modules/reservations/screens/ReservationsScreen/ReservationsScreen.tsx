"use client";

import { useMemo, useState } from "react";
import { toast } from "@heroui/react";
import {
  useCancelCoachBooking,
  useCancelClassEnrollment,
  useCancelReservation,
  useMyClassEnrollments,
  useMyCoachBookings,
  useMyReservations,
  useResolveMockClubPayment,
  useResolveMockClassPayment,
  useResolveMockCoachPayment,
} from "@api";
import { useTranslations } from "next-intl";

import {
  RESERVATION_DATE_FUTURE_DAYS,
  RESERVATION_DATE_PAST_DAYS,
} from "../../reservations.constants";
import type { TimelineReservation } from "../../reservations.types";
import {
  buildDateStrip,
  toDateKey,
  toReservationDateKey,
} from "../../reservations.utils";
import { ReservationsHeaderSection } from "../../sections/ReservationsHeaderSection";
import { ReservationsTimelineSection } from "../../sections/ReservationsTimelineSection";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import type { ReservationsScreenProps } from "./ReservationsScreen.types";

export function ReservationsScreen({ role }: ReservationsScreenProps) {
  const t = useTranslations("athleteReservations");
  const common = useTranslations("common");
  const reservations = useMyReservations();
  const coachBookings = useMyCoachBookings();
  const classEnrollments = useMyClassEnrollments();
  const cancel = useCancelReservation();
  const cancelCoach = useCancelCoachBooking();
  const cancelClass = useCancelClassEnrollment();
  const resolveClubPayment = useResolveMockClubPayment();
  const resolveCoachPayment = useResolveMockCoachPayment();
  const resolveClassPayment = useResolveMockClassPayment();

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date()),
  );
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const items = useMemo<TimelineReservation[]>(() => {
    if (
      reservations.isPending ||
      coachBookings.isPending ||
      classEnrollments.isPending
    ) {
      return [];
    }
    const clubItems: TimelineReservation[] = (
      reservations.data?.items ?? []
    ).map((item) => ({ ...item, source: "club", sourceId: item.id }));
    const coachItems: TimelineReservation[] = (
      coachBookings.data?.items ?? []
    ).map((item) => ({
      id: `coach:${item.id}`,
      sourceId: item.id,
      source: "coach",
      sessionTitle: item.sessionTitle,
      sessionStartsAt: item.sessionStartsAt,
      sessionEndsAt: item.sessionEndsAt,
      participantCount: 1,
      status: toTimelineStatus(item.status),
      totalPrice: item.priceSnapshot.amount,
      paymentStatus: item.paymentStatus,
      refundPercent: item.refundPercent,
      refundAmount: item.refundAmount,
    }));
    const classItems: TimelineReservation[] = (
      classEnrollments.data?.items ?? []
    ).map((item) => ({
      id: `class:${item.id}`,
      sourceId: item.id,
      source: "class",
      sessionTitle: item.classTitle,
      sessionStartsAt: item.courseStartAt,
      sessionEndsAt: item.courseEndAt,
      participantCount: 1,
      status: toClassTimelineStatus(item.status),
      totalPrice: item.priceSnapshot.amount,
      paymentStatus: item.paymentStatus,
      refundPercent: item.refundPercent,
      refundAmount: item.refundAmount,
    }));
    return [...clubItems, ...coachItems, ...classItems];
  }, [
    classEnrollments.data?.items,
    classEnrollments.isPending,
    coachBookings.data?.items,
    coachBookings.isPending,
    reservations.data?.items,
    reservations.isPending,
  ]);

  const dates = useMemo(
    () =>
      buildDateStrip(
        new Date(),
        RESERVATION_DATE_PAST_DAYS,
        RESERVATION_DATE_FUTURE_DAYS,
      ),
    [],
  );

  const visibleItems = useMemo(() => {
    const forDay = items.filter(
      (item) => toReservationDateKey(item.sessionStartsAt) === selectedDateKey,
    );
    return [...forDay].sort((left, right) => {
      const delta =
        new Date(right.sessionStartsAt).getTime() -
        new Date(left.sessionStartsAt).getTime();
      return sortNewestFirst ? delta : -delta;
    });
  }, [items, selectedDateKey, sortNewestFirst]);

  const activeSelectedId =
    selectedId && visibleItems.some((item) => item.id === selectedId)
      ? selectedId
      : (visibleItems[1]?.id ?? visibleItems[0]?.id ?? null);

  const pendingPayment = items.find(
    (item) => item.paymentStatus === "pending" && item.sourceId,
  );

  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment?.sourceId) return;
    try {
      if (pendingPayment.source === "coach") {
        await resolveCoachPayment.mutateAsync({
          bookingId: pendingPayment.sourceId,
          result,
        });
      } else if (pendingPayment.source === "class") {
        await resolveClassPayment.mutateAsync({
          enrollmentId: pendingPayment.sourceId,
          result,
        });
      } else {
        await resolveClubPayment.mutateAsync({
          reservationId: pendingPayment.sourceId,
          result,
        });
      }
      if (result === "approve") {
        toast.success("پرداخت موفق بود و رزرو قطعی شد");
      } else {
        toast.danger("پرداخت ناموفق بود و ظرفیت رزرو آزاد شد");
      }
    } catch {
      toast.danger("ثبت نتیجه پرداخت انجام نشد؛ دوباره تلاش کنید");
    }
  };

  const cancelReservation = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target || !target.sourceId) {
      return;
    }
    if (!window.confirm(t("cancelConfirm"))) {
      return;
    }
    try {
      const result =
        target.source === "coach"
          ? await cancelCoach.mutateAsync(target.sourceId)
          : target.source === "class"
            ? await cancelClass.mutateAsync(target.sourceId)
            : await cancel.mutateAsync(target.sourceId);
      toast.success(
        t("cancelSuccess", {
          percent: Number(result.refundPercent ?? 0),
          amount: Number(result.refundAmount ?? 0).toLocaleString("fa-IR"),
        }),
      );
    } catch {
      toast.danger(t("cancelError"));
    }
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background">
      <ReservationsHeaderSection
        title={t("title")}
        backLabel={common("back")}
        backHref={`/${role}`}
        datesLabel={t("datesLabel")}
        dates={dates}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
      />
      <ReservationsTimelineSection
        title={t("all")}
        newestFirstLabel={t("newestFirst")}
        oldestFirstLabel={t("oldestFirst")}
        sortNewestFirst={sortNewestFirst}
        onToggleSort={() => setSortNewestFirst((value) => !value)}
        items={visibleItems}
        isPending={
          reservations.isPending ||
          coachBookings.isPending ||
          classEnrollments.isPending
        }
        emptyLabel={items.length === 0 ? t("empty") : t("emptyDay")}
        selectedId={activeSelectedId}
        onSelect={setSelectedId}
        favoriteIds={favoriteIds}
        onToggleFavorite={(id) =>
          setFavoriteIds((current) => {
            const next = new Set(current);
            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }
            return next;
          })
        }
        onCancel={cancelReservation}
        cancelPending={
          cancel.isPending || cancelCoach.isPending || cancelClass.isPending
        }
        peopleLabel={(count) =>
          t("people", { count: count.toLocaleString("fa-IR") })
        }
        durationLabel={(minutes) =>
          t("duration", { minutes: minutes.toLocaleString("fa-IR") })
        }
        statusLabel={(status) => t(status)}
        favoriteLabel={t("favorite")}
        unfavoriteLabel={t("unfavorite")}
        cancelLabel={t("cancel")}
      />
      {pendingPayment ? (
        <MockPaymentGateway
          title={pendingPayment.sessionTitle}
          amount={pendingPayment.totalPrice}
          isPending={
            resolveClubPayment.isPending ||
            resolveCoachPayment.isPending ||
            resolveClassPayment.isPending
          }
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}
    </main>
  );
}

function toClassTimelineStatus(
  status: "pending" | "active" | "rejected" | "cancelled" | "completed",
): TimelineReservation["status"] {
  if (status === "pending" || status === "active") return "reserved";
  if (status === "completed") return "completed";
  return "cancelled";
}

function toTimelineStatus(
  status:
    | "pending"
    | "confirmed"
    | "rejected"
    | "cancelled_by_athlete"
    | "cancelled_by_coach"
    | "completed"
    | "no_show",
): TimelineReservation["status"] {
  if (status === "pending" || status === "confirmed") return "reserved";
  if (status === "completed" || status === "no_show") return status;
  return "cancelled";
}
