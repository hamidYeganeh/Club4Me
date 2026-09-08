"use client";
import { SecondaryHeader } from "../../components/SecondaryHeader";
import { DiscoveryHeroScrim } from "../../components/DiscoveryImageHero";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  toast,
  Checkbox,
  Label,
  Radio,
  RadioGroup,
  ScrollShadow,
  Tabs,
  Typography,
} from "@heroui/react";
import {
  tokenStore,
  ApiError,
  trackCheckoutStarted,
  trackPaymentSucceeded,
  usePublicClub,
  useReservableSessions,
  useReserveSession,
  useQuoteReservation,
  useResolveMockClubPayment,
  useMyEntitlements,
  type ReservableSession,
} from "@api";
import { useCatalogClub } from "@api/discovery";
import { Icon } from "@theme/icon";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import NumberFlow from "@number-flow/react";
import { useTranslations } from "next-intl";
import { rememberAuthReturnPath } from "@/lib/auth-return-path";
import {
  readReservationSelection,
  writeReservationSelection,
} from "@/lib/reservation-return-selection";
import { cn } from "@/lib/cn";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { SlotBookingSkeleton } from "@/components/loading-skeletons";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { ReservationResultScreen } from "@modules/reservations/components/ReservationResultScreen";
import { ReservationReviewScreen } from "@modules/reservations/components/ReservationReviewScreen";

import { discoveryClubSlotsScreenStyles } from "./DiscoveryClubSlotsScreen.styles";
import type { DiscoveryClubSlotsScreenProps } from "./DiscoveryClubSlotsScreen.types";

function toDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTimeRange(startsAt: string, endsAt: string) {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

type HeatmapDay = {
  id: string;
  day: string;
  weekday: string;
  slotCount: number;
  availableCount: number;
};

function AvailabilityHeatmap({
  days,
  selectedKey,
  onSelect,
}: {
  days: HeatmapDay[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-foreground/8 bg-surface-secondary/55 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-foreground">نمای دو هفته</p>
          <p className="mt-1 text-[0.65rem] text-muted">
            برای دیدن سانس‌ها یک روز را لمس کنید
          </p>
        </div>
        <div
          className="flex items-center gap-1 text-[0.6rem] text-muted"
          aria-label="راهنمای میزان ظرفیت"
        >
          <span>کم</span>
          {["bg-foreground/8", "bg-accent/25", "bg-accent/55", "bg-accent"].map(
            (className) => (
              <span
                key={className}
                className={cn("size-2.5 rounded-[0.2rem]", className)}
              />
            ),
          )}
          <span>زیاد</span>
        </div>
      </div>
      <div
        className="grid grid-cols-7 gap-1.5"
        role="grid"
        aria-label="ظرفیت سانس‌های چهارده روز آینده"
      >
        {days.map((date) => {
          const intensity =
            date.availableCount === 0
              ? "bg-foreground/7 text-muted"
              : date.availableCount >= 6
                ? "bg-accent text-accent-foreground"
                : date.availableCount >= 3
                  ? "bg-accent/55 text-foreground"
                  : "bg-accent/25 text-foreground";
          return (
            <button
              key={date.id}
              type="button"
              role="gridcell"
              aria-selected={selectedKey === date.id}
              aria-label={`${date.weekday} ${date.day}، ${date.availableCount.toLocaleString("fa-IR")} سانس قابل رزرو`}
              onClick={() => onSelect(date.id)}
              className={cn(
                "flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg text-center transition-[transform,box-shadow] active:scale-95",
                intensity,
                selectedKey === date.id &&
                  "ring-2 ring-foreground ring-offset-2 ring-offset-surface",
              )}
            >
              <span className="text-[0.58rem] font-medium opacity-75">
                {date.weekday}
              </span>
              <span className="mt-0.5 text-sm font-black tabular-nums">
                {date.day}
              </span>
              <span className="mt-0.5 text-[0.55rem] font-bold opacity-75">
                {date.availableCount
                  ? date.availableCount.toLocaleString("fa-IR")
                  : "—"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DiscoveryClubSlotsScreen({
  clubId,
}: DiscoveryClubSlotsScreenProps) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("discovery.clubSlots");
  const styles = discoveryClubSlotsScreenStyles();
  const catalogClub = useCatalogClub(clubId);
  const persistedId = catalogClub.data?.id ?? "";
  const isPersistedClub = Boolean(persistedId);
  const rootRef = useRef<HTMLElement>(null);

  const publicClub = usePublicClub(persistedId);
  const sessionsQuery = useReservableSessions(persistedId);
  const reserve = useReserveSession();
  const quote = useQuoteReservation();
  const resolvePayment = useResolveMockClubPayment();
  const entitlements = useMyEntitlements(Boolean(tokenStore.get()));

  const [courtKey, setCourtKey] = useState<string>(params.get("court") ?? "");
  const [dateKey, setDateKey] = useState<string>(params.get("date") ?? "");
  const [onlyAvailableDates, setOnlyAvailableDates] = useState(true);
  const [sessionId, setSessionId] = useState<string>(
    params.get("session") ?? "",
  );
  const [entitlementId, setEntitlementId] = useState("");
  const [isTrial, setIsTrial] = useState(false);
  const [bookingError, setBookingError] = useState<string>();
  const [entitlementSheetOpen, setEntitlementSheetOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    title: string;
    amount: number;
    expiresAt?: string | null;
  } | null>(null);
  const [reservationResult, setReservationResult] = useState<
    "success" | "failed" | null
  >(null);
  const [showReview, setShowReview] = useState(false);
  const [selection, setSelection] = useState(() =>
    readReservationSelection(params),
  );

  const dateWindow = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 13);
    end.setHours(23, 59, 59, 999);
    return { startMs: start.getTime(), endMs: end.getTime() };
  }, []);

  const sessions = useMemo(
    () =>
      (sessionsQuery.data?.items ?? []).filter((item) => {
        if (item.status !== "active") return false;
        const startsAtMs = new Date(item.startsAt).getTime();
        return (
          startsAtMs >= dateWindow.startMs && startsAtMs <= dateWindow.endMs
        );
      }),
    [dateWindow.endMs, dateWindow.startMs, sessionsQuery.data?.items],
  );

  const courts = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of sessions) {
      const key = session.courtId ?? `session:${session.id}`;
      if (!map.has(key)) {
        map.set(key, session.title);
      }
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [sessions]);

  const selectedCourtKey = courts.some((court) => court.id === courtKey)
    ? courtKey
    : (courts[0]?.id ?? "");

  const courtSessions = useMemo(() => {
    if (!selectedCourtKey) return sessions;
    return sessions.filter((session) => {
      const key = session.courtId ?? `session:${session.id}`;
      return key === selectedCourtKey;
    });
  }, [selectedCourtKey, sessions]);

  const dates = useMemo(() => {
    const start = new Date(dateWindow.startMs);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const id = toDateKey(date);
      const hasSlots = courtSessions.some(
        (session) => toDateKey(session.startsAt) === id,
      );
      const daySessions = courtSessions.filter(
        (session) => toDateKey(session.startsAt) === id,
      );
      return {
        id,
        hasSlots,
        slotCount: daySessions.length,
        availableCount: daySessions.filter(
          (session) => session.reservedCount < session.capacity,
        ).length,
        day: new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(date),
        weekday: new Intl.DateTimeFormat("fa-IR", { weekday: "short" }).format(
          date,
        ),
      };
    });
  }, [courtSessions, dateWindow.startMs]);

  const visibleDates = onlyAvailableDates
    ? dates.filter((date) => date.hasSlots)
    : dates;

  const selectedDateKey = visibleDates.some((date) => date.id === dateKey)
    ? dateKey
    : (visibleDates[0]?.id ?? "");

  const timeSlots = useMemo(
    () =>
      courtSessions
        .filter((session) => toDateKey(session.startsAt) === selectedDateKey)
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
    [courtSessions, selectedDateKey],
  );

  const selectedSessionId = timeSlots.some((slot) => slot.id === sessionId)
    ? sessionId
    : "";

  const selectedSession: ReservableSession | undefined = timeSlots.find(
    (session) => session.id === selectedSessionId,
  );
  const participantCount =
    selection.sessionId === selectedSessionId ? selection.participantCount : 1;
  const quantities =
    selection.sessionId === selectedSessionId ? selection.quantities : {};
  const selectedOptions = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([optionId, quantity]) => ({ optionId, quantity }));
  const optionsAmount = (selectedSession?.options ?? []).reduce(
    (sum, option) => sum + option.unitPrice * (quantities[option.id] ?? 0),
    0,
  );
  const baseAmount =
    (selectedSession?.basePrice ?? 0) *
    (selectedSession?.pricingUnit === "per_participant" ? participantCount : 1);
  const eligibleEntitlements = useMemo(() => {
    if (!selectedSession || participantCount !== 1) return [];
    const sessionType = selectedSession.courtId
      ? "court"
      : selectedSession.classId
        ? "class"
        : "coached_session";
    return (entitlements.data?.items ?? []).filter(
      (item) =>
        item.clubId === persistedId &&
        item.status === "active" &&
        item.sessionTypes.includes(sessionType),
    );
  }, [
    entitlements.data?.items,
    persistedId,
    selectedSession,
    participantCount,
  ]);
  const selectedEntitlement = eligibleEntitlements.find(
    (item) => item.id === entitlementId,
  );
  const goToAuth = () => {
    const destination = new URL(window.location.href);
    destination.searchParams.set("court", selectedCourtKey);
    destination.searchParams.set("date", selectedDateKey);
    writeReservationSelection(destination.searchParams, {
      sessionId: selectedSessionId,
      participantCount,
      quantities,
    });
    rememberAuthReturnPath(destination.pathname + destination.search);
    router.push("/auth");
  };
  const reserveButtonSize = "lg" as const;
  const isReserveButtonLarge = reserveButtonSize === "lg";

  const coverUrl = useMemo(() => {
    const gallery = publicClub.data?.gallery ?? [];
    const coverMediaId = publicClub.data?.coverMediaId;
    const coverMatch = coverMediaId
      ? gallery.find((item) => item.mediaId === coverMediaId)
      : undefined;
    const firstImage = gallery.find((item) =>
      item.mimeType.startsWith("image/"),
    );
    return coverMatch?.url ?? firstImage?.url;
  }, [publicClub.data?.coverMediaId, publicClub.data?.gallery]);

  const ready =
    isPersistedClub &&
    !publicClub.isPending &&
    !sessionsQuery.isPending &&
    !publicClub.isError &&
    Boolean(publicClub.data);

  useGSAP(
    () => {
      if (!ready || !rootRef.current) return;

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;

      const ctx = gsap.context(() => {
        const cover = rootRef.current?.querySelector("[data-slots-cover]");
        const titleBits = rootRef.current?.querySelectorAll(
          "[data-slots-title] > *",
        );
        const chips = rootRef.current?.querySelectorAll("[data-slots-chip]");
        const panel = rootRef.current?.querySelector("[data-slots-panel]");
        const sections = rootRef.current?.querySelectorAll(
          "[data-slots-section]",
        );

        if (cover) {
          gsap.fromTo(
            cover,
            { scale: 1.18, opacity: 0.55 },
            { scale: 1, opacity: 1, duration: 1.45, ease: "power3.out" },
          );
        }

        if (titleBits?.length) {
          gsap.fromTo(
            titleBits,
            { autoAlpha: 0, y: 28, filter: "blur(8px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              delay: 0.15,
            },
          );
        }

        if (chips?.length) {
          gsap.fromTo(
            chips,
            { autoAlpha: 0, y: 18, scale: 0.92 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.45,
              stagger: 0.06,
              ease: "power2.out",
              delay: 0.35,
            },
          );
        }

        if (panel) {
          gsap.fromTo(
            panel,
            { y: 64, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.75,
              ease: "power3.out",
              delay: 0.28,
            },
          );
        }

        if (sections?.length) {
          gsap.fromTo(
            sections,
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: "power2.out",
              delay: 0.48,
            },
          );
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { dependencies: [ready, persistedId], revertOnUpdate: true },
  );

  const book = async () => {
    setBookingError(undefined);
    if (!selectedSession) return;
    if (!tokenStore.get()) {
      goToAuth();
      return;
    }
    try {
      trackCheckoutStarted({
        club_id: persistedId,
        session_id: selectedSession.id,
      });
      const result = await reserve.mutateAsync({
        sessionId: selectedSession.id,
        participantCount,
        options: selectedOptions,
        expectedTotalPrice: quote.data?.totalPrice,
        expectedCurrency: quote.data?.currency,
        isTrial,
        ...(!isTrial && selectedEntitlement
          ? { entitlementId: selectedEntitlement.id }
          : {}),
      });
      if (result.paymentStatus === "pending") {
        setShowReview(false);
        setPendingPayment({
          id: result.id,
          title: result.sessionTitle,
          amount: result.totalPrice,
          expiresAt: result.paymentExpiresAt,
        });
      } else {
        setShowReview(false);
        setReservationResult("success");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const messages: Record<string, string> = {
          TRIAL_ALREADY_USED:
            "جلسه آزمایشی این باشگاه را قبلاً رزرو یا استفاده کرده‌اید. رزروهای خود را بررسی کنید.",
          TRIAL_NOT_AVAILABLE:
            "باشگاه در حال حاضر رزرو آزمایشی نمی‌پذیرد. برای رزرو عادی، گزینه آزمایشی را خاموش کنید.",
          RESERVATION_PRICE_CHANGED:
            "قیمت تغییر کرده است؛ خلاصه رزرو را دوباره بررسی کنید.",
          PAYMENT_EXPIRED:
            "مهلت پرداخت تمام شده است؛ دوباره زمان را انتخاب کنید.",
          INVALID_TRIAL_BOOKING:
            "رزرو آزمایشی فقط برای یک نفر و بدون خدمات جانبی امکان‌پذیر است.",
        };
        setBookingError(messages[error.code]);
      }
      setShowReview(false);
      setReservationResult("failed");
    }
  };

  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment) return;
    try {
      const payment = await resolvePayment.mutateAsync({
        reservationId: pendingPayment.id,
        result,
      });
      if (payment.status === "paid") {
        trackPaymentSucceeded({
          reservation_id: pendingPayment.id,
          club_id: persistedId,
        });
        setReservationResult("success");
      } else {
        setReservationResult("failed");
      }
      setPendingPayment(null);
    } catch {
      setPendingPayment(null);
      setReservationResult("failed");
    }
  };

  const loadError =
    getQueryFailure(catalogClub.error, catalogClub.fetchStatus) ??
    getQueryFailure(publicClub.error, publicClub.fetchStatus) ??
    getQueryFailure(sessionsQuery.error, sessionsQuery.fetchStatus);

  if (loadError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <RequestFailureState
          error={loadError}
          className="w-full max-w-md"
          onRetry={() => {
            void catalogClub.refetch();
            if (persistedId) {
              void publicClub.refetch();
              void sessionsQuery.refetch();
            }
          }}
        />
      </main>
    );
  }

  if (
    catalogClub.isPending ||
    publicClub.isPending ||
    sessionsQuery.isPending
  ) {
    return <SlotBookingSkeleton />;
  }

  const clubName = publicClub.data?.name ?? "";

  if (reservationResult) {
    return (
      <ReservationResultScreen
        status={reservationResult}
        message={reservationResult === "failed" ? bookingError : undefined}
        entity={{
          kind: "club",
          title: clubName,
          subtitle:
            catalogClub.data?.shortDescription ||
            catalogClub.data?.address ||
            "رزرو سانس باشگاه",
          meta: `${(catalogClub.data?.averageRating ?? 0).toLocaleString("fa-IR")} ★ · ${(catalogClub.data?.reviewsCount ?? 0).toLocaleString("fa-IR")} نظر`,
          imageUrl: coverUrl ?? catalogClub.data?.imageUrl,
        }}
        onPrimary={() => {
          if (reservationResult === "success") {
            router.push("/athlete/reservations");
          } else {
            setReservationResult(null);
          }
        }}
        onSecondary={() =>
          router.push(
            reservationResult === "success"
              ? "/discovery/clubs"
              : "/athlete/reservations",
          )
        }
      />
    );
  }

  if (showReview && selectedSession) {
    return (
      <ReservationReviewScreen
        entity={{
          kind: "club",
          title: clubName,
          subtitle: catalogClub.data?.shortDescription || "رزرو سانس باشگاه",
          imageUrl: coverUrl ?? catalogClub.data?.imageUrl,
          rating: catalogClub.data?.averageRating,
          reviewsCount: catalogClub.data?.reviewsCount,
        }}
        session={{
          title: selectedSession.title,
          startsAt: selectedSession.startsAt,
          endsAt: selectedSession.endsAt,
          deliveryMode: "club",
          address: publicClub.data?.location?.address,
          participantCount,
          amount: quote.data
            ? quote.data.totalPrice + quote.data.coveredAmount
            : isTrial
              ? 0
              : selectedSession.basePrice,
          currency: quote.data?.currency ?? selectedSession.currency,
          pricingUnit: quote.data?.pricingUnit ?? selectedSession.pricingUnit,
          includedTaxAmount: quote.data?.taxAmount,
          paymentLabel: isTrial
            ? "جلسه آزمایشی رایگان"
            : selectedEntitlement?.title,
          coveredAmount:
            !isTrial && selectedEntitlement
              ? (quote.data?.coveredAmount ?? baseAmount)
              : undefined,
          cancellationPolicy: selectedSession.cancellationPolicy,
        }}
        isPending={reserve.isPending}
        onBack={() => setShowReview(false)}
        onConfirm={() => void book()}
      />
    );
  }

  return (
    <main ref={rootRef} className={styles.root()}>
      {pendingPayment ? (
        <MockPaymentGateway
          reference={{ referenceType: "reservation", referenceId: pendingPayment.id }}
          title={pendingPayment.title}
          amount={pendingPayment.amount}
          expiresAt={pendingPayment.expiresAt}
          isPending={resolvePayment.isPending}
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}

      <BottomSheet
        open={entitlementSheetOpen}
        onOpenChange={setEntitlementSheetOpen}
        snapPoints={["auto"]}
        title="انتخاب روش استفاده"
        description="پرداخت عادی یا یکی از بسته‌ها و عضویت‌های فعال را انتخاب کنید."
        className="max-h-[86dvh]"
      >
        <div
          role="radiogroup"
          aria-label="انتخاب بسته یا عضویت"
          className="flex flex-col gap-3 pt-2"
        >
          <EntitlementOption
            title="پرداخت عادی"
            description="هزینه این رزرو را جداگانه پرداخت می‌کنید."
            selected={!selectedEntitlement}
            onSelect={() => {
              setEntitlementId("");
              setEntitlementSheetOpen(false);
            }}
          />
          {eligibleEntitlements.map((item) => (
            <EntitlementOption
              key={item.id}
              title={item.title}
              description={
                item.remainingSessions !== null
                  ? `${item.remainingSessions.toLocaleString("fa-IR")} جلسه باقی‌مانده`
                  : `${Math.max(0, (item.weeklyLimit ?? 0) - item.weeklyUsed).toLocaleString("fa-IR")} استفاده این هفته`
              }
              selected={selectedEntitlement?.id === item.id}
              onSelect={() => {
                setEntitlementId(item.id);
                setEntitlementSheetOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <SecondaryHeader title={t("title")} showFilter={false} />
      <div className={styles.coverWrap()}>
        {coverUrl ? (
          <div
            data-slots-cover
            className={styles.cover()}
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div data-slots-cover className={styles.coverFallback()}>
            <Icon name="tennis" size={56} />
          </div>
        )}
      </div>
      <div aria-hidden className={styles.overlay()}>
        <DiscoveryHeroScrim />
      </div>
      <div aria-hidden className={styles.grain()} />
      <div aria-hidden className={styles.accentOrb()} />

      <section className={styles.hero()} aria-labelledby="club-slots-title">
        <div data-slots-title className={styles.heroCopy()}>
          <p className={styles.heroEyebrow()}>{t("eyebrow")}</p>
          <h1 id="club-slots-title" className={styles.heroTitle()}>
            {t("title")}
          </h1>
          <p className={styles.heroSubtitle()}>{clubName}</p>
        </div>

        {courts.length > 0 ? (
          <div className={styles.chipRow()}>
            <ScrollShadow
              orientation="horizontal"
              hideScrollBar
              className={styles.chipScroller()}
            >
              <div className={styles.chipContent()}>
                {courts.map((court) => {
                  const selected = court.id === selectedCourtKey;
                  return (
                    <Button
                      key={court.id}
                      data-slots-chip
                      variant={selected ? "primary" : "secondary"}
                      size="md"
                      className={cn(
                        styles.chipButton(),
                        selected ? styles.chipActive() : styles.chipIdle(),
                      )}
                      aria-pressed={selected}
                      onPress={() => {
                        setCourtKey(court.id);
                        setDateKey("");
                        setSessionId("");
                      }}
                    >
                      {court.label}
                    </Button>
                  );
                })}
              </div>
            </ScrollShadow>
          </div>
        ) : null}
      </section>

      <section data-slots-panel className={styles.panel()}>
        {sessions.length === 0 ? (
          <div className={styles.empty()}>
            <Image
              src="/discovery/no-slots.png"
              alt={t("emptyIllustrationAlt")}
              width={320}
              height={320}
              className={styles.emptyImage()}
              priority
            />
            <Typography type="body-sm" className={styles.emptyText()}>
              {t("noSessions")}
            </Typography>
          </div>
        ) : (
          <div className={styles.panelBody()}>
            <div className={styles.panelContent()}>
              <div data-slots-section className={styles.section()}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label className={styles.sectionLabel()}>
                    <span className={styles.sectionIcon()}>
                      <Icon name="calendar-1" size={14} />
                    </span>
                    {t("selectDate")}
                  </Label>
                  <Checkbox
                    isSelected={onlyAvailableDates}
                    onChange={(selected) => {
                      setOnlyAvailableDates(selected);
                      setDateKey("");
                      setSessionId("");
                    }}
                  >
                    <Checkbox.Content className="text-xs text-muted">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      فقط روزهای دارای سانس
                    </Checkbox.Content>
                  </Checkbox>
                </div>
                <AvailabilityHeatmap
                  days={dates}
                  selectedKey={selectedDateKey}
                  onSelect={(key) => {
                    setOnlyAvailableDates(false);
                    setDateKey(key);
                    setSessionId("");
                  }}
                />
                <ScrollShadow
                  orientation="horizontal"
                  hideScrollBar
                  className={styles.radioRow()}
                >
                  <Tabs
                    selectedKey={selectedDateKey}
                    onSelectionChange={(key) => {
                      setDateKey(String(key));
                      setSessionId("");
                    }}
                    className={styles.dateTabs()}
                  >
                    <Tabs.ListContainer
                      className={styles.dateTabsListContainer()}
                    >
                      <Tabs.List
                        aria-label={t("selectDate")}
                        className={styles.dateTabsList()}
                      >
                        {visibleDates.map((date) => (
                          <Tabs.Tab
                            key={date.id}
                            id={date.id}
                            className={styles.dateTab()}
                          >
                            <span className={styles.dateDay()}>{date.day}</span>
                            <span className={styles.dateWeekday()}>
                              {date.weekday}
                            </span>
                            <Tabs.Indicator
                              className={styles.dateTabIndicator()}
                            />
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs.ListContainer>
                  </Tabs>
                </ScrollShadow>
              </div>

              <div data-slots-section className={styles.section()}>
                <Label className={styles.sectionLabel()}>
                  <span className={styles.sectionIcon()}>
                    <Icon name="clock" size={14} />
                  </span>
                  {t("selectTime")}
                </Label>
                {!selectedSessionId && timeSlots.length > 0 ? (
                  <p className="text-xs font-medium text-muted">
                    برای ادامه، یکی از ساعت‌های زیر را انتخاب کنید.
                  </p>
                ) : null}
                <div className={styles.timeArea()}>
                  {timeSlots.length === 0 ? (
                    <div className={styles.timeEmpty()}>
                      <Image
                        src="/discovery/no-slots.png"
                        alt={t("emptyIllustrationAlt")}
                        width={128}
                        height={128}
                        className={styles.timeEmptyImage()}
                      />
                      <span>{t("noTimes")}</span>
                    </div>
                  ) : (
                    <ScrollShadow
                      orientation="horizontal"
                      hideScrollBar
                      className={styles.timeScroller()}
                    >
                      <RadioGroup
                        aria-label={t("selectTime")}
                        name="reservation-time"
                        orientation="horizontal"
                        value={selectedSessionId}
                        onChange={setSessionId}
                        className={styles.radioGroup()}
                      >
                        {timeSlots.map((slot) => (
                          <Radio
                            key={slot.id}
                            value={slot.id}
                            className={styles.timeRadio()}
                            isDisabled={slot.reservedCount >= slot.capacity}
                          >
                            {({ isSelected }) => (
                              <Radio.Content
                                dir="ltr"
                                className={cn(
                                  styles.timeContent(),
                                  isSelected && styles.timeContentSelected(),
                                )}
                              >
                                <Radio.Control
                                  className={styles.controlHidden()}
                                >
                                  <Radio.Indicator />
                                </Radio.Control>
                                {formatTimeRange(slot.startsAt, slot.endsAt)}
                              </Radio.Content>
                            )}
                          </Radio>
                        ))}
                      </RadioGroup>
                    </ScrollShadow>
                  )}
                </div>
              </div>
            </div>

            {publicClub.data?.trialBookingEnabled && (
              <label className="flex items-start gap-3 rounded-2xl bg-surface-secondary p-4 text-sm">
                <input
                  type="checkbox"
                  checked={isTrial}
                  disabled={
                    participantCount !== 1 || selectedOptions.length > 0
                  }
                  onChange={(e) => {
                    setIsTrial(e.target.checked);
                    if (e.target.checked) setEntitlementId("");
                  }}
                />
                <span>
                  رزرو جلسه آزمایشی رایگان
                  <small className="mt-1 block text-muted">
                    یک بار برای هر کاربر در این باشگاه، برای یک نفر و بدون خدمات
                    جانبی. لغو جلسه امکان رزرو مجدد می‌دهد.
                  </small>
                </span>
              </label>
            )}
            {selectedSession && !isTrial ? (
              <div data-slots-section className={styles.section()}>
                <Label className={styles.sectionLabel()}>
                  استفاده از بسته یا عضویت
                </Label>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={entitlementSheetOpen}
                  onClick={() => setEntitlementSheetOpen(true)}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-foreground/10 bg-surface-secondary px-4 text-start text-sm font-semibold text-foreground transition-transform active:scale-[0.99]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent">
                    <Icon name="ticket" size={18} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {selectedEntitlement?.title ?? "پرداخت عادی"}
                  </span>
                  <Icon name="chevron-down" size={16} className="text-muted" />
                </button>
              </div>
            ) : null}

            {selectedSession && !isTrial ? (
              <div className="space-y-4 rounded-2xl border border-border p-4">
                <label className="block text-sm font-bold">
                  تعداد نفرات
                  <input
                    aria-label="تعداد نفرات رزرو"
                    type="number"
                    min={1}
                    max={Math.min(
                      100,
                      selectedSession.capacity - selectedSession.reservedCount,
                    )}
                    value={participantCount}
                    className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3"
                    onChange={(event) =>
                      setSelection({
                        sessionId: selectedSession.id,
                        quantities,
                        participantCount: Math.max(
                          1,
                          Math.min(100, Number(event.target.value) || 1),
                        ),
                      })
                    }
                  />
                </label>
                <p className="text-xs text-muted">
                  {selectedSession.pricingUnit === "per_court"
                    ? "قیمت پایه برای کل زمین است."
                    : selectedSession.pricingUnit === "per_session"
                      ? "قیمت پایه برای کل سانس است."
                      : "قیمت پایه به‌ازای هر نفر محاسبه می‌شود."}
                </p>
                {selectedSession.options.map((option) => (
                  <label key={option.id} className="block text-sm">
                    {option.title ||
                      (option.type === "equipment"
                        ? "تجهیزات"
                        : "خدمت جانبی")}{" "}
                    · {option.unitPrice.toLocaleString("fa-IR")} ریال
                    <input
                      aria-label={`تعداد ${option.title || "خدمت جانبی"}`}
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3"
                      type="number"
                      min={0}
                      max={Math.max(
                        0,
                        Math.min(
                          option.maxPerReservation,
                          option.availableQuantity - option.reservedQuantity,
                        ),
                      )}
                      value={quantities[option.id] ?? 0}
                      onChange={(event) =>
                        setSelection({
                          sessionId: selectedSession.id,
                          participantCount,
                          quantities: {
                            ...quantities,
                            [option.id]: Math.max(
                              0,
                              Number(event.target.value) || 0,
                            ),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            ) : null}

            <div
              data-slots-section
              className={cn(
                styles.footer(),
                isReserveButtonLarge && styles.footerSticky(),
              )}
            >
              <div>
                <p className={styles.priceLabel()}>{t("price")}</p>
                <p className={styles.priceValue()}>
                  {selectedSession ? (
                    <>
                      <NumberFlow
                        value={
                          isTrial
                            ? 0
                            : (selectedEntitlement ? 0 : baseAmount) +
                              optionsAmount
                        }
                        locales="fa-IR"
                        format={{ useGrouping: true }}
                        className="inline-block min-w-[3ch]"
                      />
                      <span className="ms-1 text-base font-bold text-muted">
                        ریال
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                size={reserveButtonSize}
                className={styles.bookButton()}
                isPending={quote.isPending || reserve.isPending}
                isDisabled={!selectedSession}
                onPress={async () => {
                  if (!selectedSession) return;
                  if (!tokenStore.get()) {
                    goToAuth();
                    return;
                  }
                  try {
                    await quote.mutateAsync({
                      sessionId: selectedSession.id,
                      participantCount,
                      options: selectedOptions,
                      isTrial,
                      ...(!isTrial && selectedEntitlement
                        ? { entitlementId: selectedEntitlement.id }
                        : {}),
                    });
                    setShowReview(true);
                  } catch {
                    toast.danger(
                      "دریافت قیمت نهایی انجام نشد؛ دوباره تلاش کنید",
                    );
                  }
                }}
              >
                {selectedSession ? t("bookNow") : "ابتدا ساعت را انتخاب کنید"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function EntitlementOption({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-start transition-[border-color,background-color,transform] active:scale-[0.99]",
        selected
          ? "border-accent bg-accent/8"
          : "border-border bg-surface-secondary/60",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl",
          selected
            ? "bg-accent text-accent-foreground"
            : "bg-surface text-muted",
        )}
      >
        <Icon name={selected ? "check" : "ticket"} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">
          {description}
        </span>
      </span>
    </button>
  );
}
