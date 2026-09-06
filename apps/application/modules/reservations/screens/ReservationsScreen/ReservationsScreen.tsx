"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { usePublicCatalogResource } from "@api/discovery";

import {
  RESERVATION_DATE_FUTURE_DAYS,
  RESERVATION_DATE_PAST_DAYS,
} from "../../reservations.constants";
import type { TimelineReservation } from "../../reservations.types";
import {
  buildDateStrip,
  buildMonthDates,
  toDateKey,
  toReservationDateKey,
} from "../../reservations.utils";
import { ReservationsHeaderSection } from "../../sections/ReservationsHeaderSection";
import { ReservationsTimelineSection } from "../../sections/ReservationsTimelineSection";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import type { ReservationsScreenProps } from "./ReservationsScreen.types";
import { ReservationActionScreen } from "../../sections/ReservationActionScreen";
import {
  getQueryFailure,
  getRequestFailurePresentation,
} from "@/lib/request-failure";

export function ReservationsScreen({ role }: ReservationsScreenProps) {
  const router = useRouter();
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
  const cancellationReasons = usePublicCatalogResource(
    "commerce",
    "cancellation-reason",
    { limit: 100 },
  );

  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date()),
  );
  const [monthExpanded, setMonthExpanded] = useState(false);
  const pageRef = useRef<HTMLElement>(null);
  const pullStart = useRef<{ x: number; y: number } | null>(null);
  const monthDates = useMemo(
    () => buildMonthDates(new Date(`${selectedDateKey}T12:00:00`)),
    [selectedDateKey],
  );
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionReservationId, setActionReservationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const page = pageRef.current;
    if (!page || monthExpanded) return;
    const onMove = (event: TouchEvent) => {
      const start = pullStart.current;
      const touch = event.touches[0];
      if (!start || !touch) return;
      const dy = touch.clientY - start.y;
      if (
        dy > 8 &&
        dy > Math.abs(touch.clientX - start.x) * 1.5 &&
        event.cancelable
      )
        event.preventDefault();
    };
    page.addEventListener("touchmove", onMove, { passive: false });
    return () => page.removeEventListener("touchmove", onMove);
  }, [monthExpanded, actionReservationId]);

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
    ).map((item) => ({
      ...item,
      source: "club",
      sourceId: item.id,
      changeTimeHref: `/discovery/clubs/${item.clubId}/slots`,
      cancellationPolicyTitle: item.cancellationPolicy.title,
    }));
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
      changeTimeHref: `/discovery/coaches/${item.coachId}`,
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
      changeTimeHref: `/discovery/classes/${item.classId}`,
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
        new Date(`${selectedDateKey}T12:00:00`),
        RESERVATION_DATE_PAST_DAYS,
        RESERVATION_DATE_FUTURE_DAYS,
      ),
    [selectedDateKey],
  );

  const visibleItems = useMemo(() => {
    const relevantItems = showAllHistory
      ? items
      : items.filter(
          (item) =>
            toReservationDateKey(item.sessionStartsAt) === selectedDateKey,
        );
    return [...relevantItems].sort((left, right) => {
      const delta =
        new Date(right.sessionStartsAt).getTime() -
        new Date(left.sessionStartsAt).getTime();
      return sortNewestFirst ? delta : -delta;
    });
  }, [items, selectedDateKey, showAllHistory, sortNewestFirst]);

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
    } catch (error) {
      const failure = getRequestFailurePresentation(error);
      toast.danger(failure.title, { description: failure.description });
    }
  };

  const cancelReservation = async (id: string, reason: string) => {
    const target = items.find((item) => item.id === id);
    if (!target || !target.sourceId) {
      return;
    }
    try {
      const result =
        target.source === "coach"
          ? await cancelCoach.mutateAsync({
              bookingId: target.sourceId,
              reason,
            })
          : target.source === "class"
            ? await cancelClass.mutateAsync(target.sourceId)
            : await cancel.mutateAsync(target.sourceId);
      toast.success(
        t("cancelSuccess", {
          percent: Number(result.refundPercent ?? 0),
          amount: Number(result.refundAmount ?? 0).toLocaleString("fa-IR"),
        }),
      );
      setActionReservationId(null);
    } catch (error) {
      const failure = getRequestFailurePresentation(error);
      toast.danger(failure.title, { description: failure.description });
    }
  };

  const actionReservation = items.find(
    (item) => item.id === actionReservationId,
  );
  const loadFailure =
    getQueryFailure(reservations.error, reservations.fetchStatus) ??
    getQueryFailure(coachBookings.error, coachBookings.fetchStatus) ??
    getQueryFailure(classEnrollments.error, classEnrollments.fetchStatus);

  if (actionReservation) {
    return (
      <ReservationActionScreen
        reservation={actionReservation}
        reasons={cancellationReasons.data?.items ?? []}
        reasonsPending={cancellationReasons.isPending}
        cancelPending={
          cancel.isPending || cancelCoach.isPending || cancelClass.isPending
        }
        onBack={() => setActionReservationId(null)}
        onCancel={(reason) =>
          void cancelReservation(actionReservation.id, reason)
        }
      />
    );
  }

  return (
    <main
      ref={pageRef}
      className="flex min-h-0 flex-1 flex-col bg-background overscroll-y-contain"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        let element = event.target as HTMLElement | null;
        while (element && element.scrollTop <= 0)
          element = element.parentElement;
        pullStart.current =
          touch && !element && window.scrollY <= 0
            ? { x: touch.clientX, y: touch.clientY }
            : null;
      }}
      onTouchEnd={(event) => {
        const start = pullStart.current;
        const touch = event.changedTouches[0];
        pullStart.current = null;
        if (
          start &&
          touch &&
          touch.clientY - start.y > 60 &&
          touch.clientY - start.y > Math.abs(touch.clientX - start.x) * 1.5
        )
          setMonthExpanded(true);
      }}
      onTouchCancel={() => {
        pullStart.current = null;
      }}
    >
      <ReservationsHeaderSection
        title={t("title")}
        backLabel={common("back")}
        backHref={`/${role}`}
        datesLabel={t("datesLabel")}
        historyLabel={t("historyLabel")}
        historyActive={showAllHistory}
        onShowHistory={() => setShowAllHistory(true)}
        dates={monthExpanded ? monthDates : dates}
        monthExpanded={monthExpanded}
        onToggleMonth={() => setMonthExpanded((value) => !value)}
        selectedDateKey={selectedDateKey}
        onSelectDate={(key) => {
          setSelectedDateKey(key);
          setShowAllHistory(false);
        }}
      />
      <ReservationsTimelineSection
        title={t("all")}
        newestFirstLabel={t("newestFirst")}
        oldestFirstLabel={t("oldestFirst")}
        sortNewestFirst={sortNewestFirst}
        onToggleSort={() => setSortNewestFirst((value) => !value)}
        items={visibleItems}
        historyMode={showAllHistory}
        isPending={
          !loadFailure &&
          (reservations.isPending ||
            coachBookings.isPending ||
            classEnrollments.isPending)
        }
        error={loadFailure}
        onRetry={() => {
          void reservations.refetch();
          void coachBookings.refetch();
          void classEnrollments.refetch();
        }}
        emptyTitle={items.length === 0 ? t("empty") : t("emptyDay")}
        emptyDescription={t("emptyDescription")}
        exploreLabel={t("explore")}
        exploreHref="/discovery"
        selectedId={activeSelectedId}
        onSelect={(id) => {
          setSelectedId(id);
          const item = items.find((candidate) => candidate.id === id);
          if (!item) return;
          router.push(
            `/athlete/reservations/${encodeURIComponent(item.sourceId ?? item.id)}?source=${item.source ?? "club"}`,
          );
        }}
        renewLabel={t("renew")}
        onRenew={(item) => router.push(item.changeTimeHref ?? "/discovery")}
        onCancel={setActionReservationId}
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
