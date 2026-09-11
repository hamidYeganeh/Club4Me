"use client";

import { useMemo, useState } from "react";
import { useNow } from "@/lib/use-now";
import { ManagedBanners } from "@/components/managed-banners";
import {
  filterReservationList,
  type ReservationListMode,
} from "@/lib/reservation-list";
import { useRouter } from "next/navigation";
import { Button, toast } from "@heroui/react";
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
  const now = useNow();
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
  const monthDates = useMemo(
    () => buildMonthDates(new Date(`${selectedDateKey}T12:00:00`)),
    [selectedDateKey],
  );
  const [sortNewestFirst, setSortNewestFirst] = useState(false);
  const [listMode, setListMode] = useState<ReservationListMode>("upcoming");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionReservationId, setActionReservationId] = useState<string | null>(
    null,
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
      paymentExpiresAt: item.paymentExpiresAt,
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
      paymentExpiresAt: item.paymentExpiresAt,
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
    const relevantItems = filterReservationList(
      items,
      listMode,
      selectedDateKey,
      now ?? Number.POSITIVE_INFINITY,
    );
    return [...relevantItems].sort((left, right) => {
      const delta =
        new Date(right.sessionStartsAt).getTime() -
        new Date(left.sessionStartsAt).getTime();
      return sortNewestFirst ? delta : -delta;
    });
  }, [items, selectedDateKey, listMode, sortNewestFirst, now]);

  const activeSelectedId =
    selectedId && visibleItems.some((item) => item.id === selectedId)
      ? selectedId
      : (visibleItems[0]?.id ?? null);

  const pendingPayment = items.find(
    (item) => item.paymentStatus === "pending" && item.sourceId,
  );

  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment?.sourceId) return;
    try {
      let paid = false;
      if (pendingPayment.source === "coach") {
        const resolved = await resolveCoachPayment.mutateAsync({
          bookingId: pendingPayment.sourceId,
          result,
        });
        paid = resolved.paymentStatus === "paid";
      } else if (pendingPayment.source === "class") {
        const resolved = await resolveClassPayment.mutateAsync({
          enrollmentId: pendingPayment.sourceId,
          result,
        });
        paid = resolved.paymentStatus === "paid";
      } else {
        const resolved = await resolveClubPayment.mutateAsync({
          reservationId: pendingPayment.sourceId,
          result,
        });
        paid = resolved.status === "paid";
      }
      if (paid) {
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
    (reservations.data
      ? null
      : getQueryFailure(reservations.error, reservations.fetchStatus)) ??
    (coachBookings.data
      ? null
      : getQueryFailure(coachBookings.error, coachBookings.fetchStatus)) ??
    (classEnrollments.data
      ? null
      : getQueryFailure(classEnrollments.error, classEnrollments.fetchStatus));

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
    <main className="flex min-h-0 flex-1 flex-col bg-background overscroll-y-contain">
      <ReservationsHeaderSection
        title={t("title")}
        backLabel={common("back")}
        backHref={`/${role}`}
        datesLabel={t("datesLabel")}
        historyLabel={t("historyLabel")}
        historyActive={listMode === "history"}
        onShowHistory={() => setListMode("history")}
        dates={monthExpanded ? monthDates : dates}
        monthExpanded={monthExpanded}
        onToggleMonth={() => setMonthExpanded((value) => !value)}
        selectedDateKey={selectedDateKey}
        onSelectDate={(key) => {
          setSelectedDateKey(key);
          setListMode("date");
        }}
      />
      <div
        className="flex flex-wrap gap-2 px-4 py-3"
        role="group"
        aria-label="نمایش رزروها"
      >
        {(
          [
            ["upcoming", "پیش‌رو"],
            ["date", "روز انتخاب‌شده"],
            ["history", "همه رزروها"],
          ] as const
        ).map(([mode, label]) => (
          <Button
            key={mode}
            size="sm"
            variant={listMode === mode ? "primary" : "secondary"}
            aria-pressed={listMode === mode}
            onPress={() => {
              setListMode(mode);
              setSortNewestFirst(mode === "history");
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <ReservationsTimelineSection
        title={listMode === "upcoming" ? "رزروهای پیش‌رو" : t("all")}
        newestFirstLabel={t("newestFirst")}
        oldestFirstLabel={t("oldestFirst")}
        sortNewestFirst={sortNewestFirst}
        onToggleSort={() => setSortNewestFirst((value) => !value)}
        items={visibleItems}
        historyMode={listMode !== "date"}
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
        emptyTitle={
          listMode === "upcoming"
            ? "رزرو پیش‌رو ندارید"
            : items.length === 0
              ? t("empty")
              : t("emptyDay")
        }
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
        renewLabel="رزرو دوباره"
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
      <ManagedBanners placement="reservations" />
      {pendingPayment ? (
        <MockPaymentGateway
          reference={{
            referenceType:
              pendingPayment.source === "coach"
                ? "coach_booking"
                : pendingPayment.source === "class"
                  ? "coach_class_enrollment"
                  : "reservation",
            referenceId: pendingPayment.sourceId!,
          }}
          title={pendingPayment.sessionTitle}
          amount={pendingPayment.totalPrice}
          expiresAt={pendingPayment.paymentExpiresAt}
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
