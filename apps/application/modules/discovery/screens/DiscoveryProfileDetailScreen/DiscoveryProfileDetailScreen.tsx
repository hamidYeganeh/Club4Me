"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, toast, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  useCatalogClass,
  useCatalogCoach,
  type PublicCatalogClass,
} from "@api/discovery";
import {
  type CoachBooking,
  type CoachSession,
  useBookCoachSession,
  useCancelCoachBooking,
  useCancelClassEnrollment,
  useEnrollClass,
  useMyClassEnrollments,
  usePublicCoachSessions,
  useResolveMockClubPayment,
  useResolveMockClassPayment,
  useResolveMockCoachPayment,
  useReserveSession,
} from "@api";

import { ButtonLink } from "@/components/button-link";
import { FallbackImage } from "@/components/FallbackImage";
import { DiscoveryPageHeader } from "@modules/discovery/components/DiscoveryPageHeader";
import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import { ReservationResultScreen } from "@modules/reservations/components/ReservationResultScreen";
import { ReservationReviewScreen } from "@modules/reservations/components/ReservationReviewScreen";
import { CoachReservationSuccessScreen } from "@modules/reservations/components/CoachReservationSuccessScreen";
import {
  DetailSocialSection,
  coachSocialLinks,
} from "@modules/discovery/components/DetailSocialSection";
import { DetailFaqSection } from "@modules/discovery/components/DetailFaqSection";
import { DetailGallerySection } from "@modules/discovery/components/DetailGallerySection";
import { CoachTrainingStylesSection } from "@modules/discovery/components/CoachTrainingStylesSection";
import { CoachProfessionalSections } from "@modules/discovery/components/CoachProfessionalSections";
import { CoachExperienceSection } from "@modules/discovery/components/CoachExperienceSection";
import {
  ReviewEmptyState,
  ReviewSummary,
} from "@modules/discovery/components/reviews";
import {
  CompactCardListSkeleton,
  DetailPageSkeleton,
} from "@/components/loading-skeletons";

type PendingMockPayment = {
  source: "club" | "coach";
  id: string;
  title: string;
  amount: number;
};

export function DiscoveryProfileDetailScreen({
  type,
  id,
}: {
  type: "coach" | "class";
  id: string;
}) {
  return type === "coach" ? <CoachDetails id={id} /> : <ClassDetails id={id} />;
}

function CoachDetails({ id }: { id: string }) {
  const router = useRouter();
  const query = useCatalogCoach(id);
  const coach = query.data;
  const sessions = usePublicCoachSessions(coach?.slug ?? "");
  const book = useBookCoachSession();
  const bookClub = useReserveSession();
  const resolveClubPayment = useResolveMockClubPayment();
  const resolveCoachPayment = useResolveMockCoachPayment();
  const cancelCoachBooking = useCancelCoachBooking();
  const [pendingPayment, setPendingPayment] =
    useState<PendingMockPayment | null>(null);
  const [reservationResult, setReservationResult] = useState<
    "success" | "failed" | null
  >(null);
  const [reviewSession, setReviewSession] = useState<CoachSession | null>(null);
  const [completedBooking, setCompletedBooking] = useState<CoachBooking | null>(
    null,
  );
  if (query.isLoading || (coach && sessions.isPending)) return <Loading />;
  if (!coach) return <Missing retry={() => query.refetch()} />;
  const phone = firstString(coach.contact, ["phone", "mobile", "telephone"]);
  const availableSessions = sessions.data?.items ?? [];
  const reserve = async (session: CoachSession) => {
    try {
      if (session.source === "club") {
        const result = await bookClub.mutateAsync({
          sessionId: session.id,
          participantCount: 1,
        });
        if (result.paymentStatus === "pending") {
          setReviewSession(null);
          setPendingPayment({
            source: "club",
            id: result.id,
            title: result.sessionTitle,
            amount: result.totalPrice,
          });
          return;
        }
      } else {
        const result = await book.mutateAsync(session.id);
        if (result.paymentStatus === "pending") {
          setReviewSession(null);
          setPendingPayment({
            source: "coach",
            id: result.id,
            title: result.sessionTitle,
            amount: result.priceSnapshot.amount,
          });
          return;
        }
        setCompletedBooking(result);
        setReviewSession(null);
        return;
      }
      setReviewSession(null);
      setReservationResult("success");
    } catch {
      setReviewSession(null);
      setReservationResult("failed");
    }
  };
  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment) return;
    try {
      if (pendingPayment.source === "club") {
        await resolveClubPayment.mutateAsync({
          reservationId: pendingPayment.id,
          result,
        });
      } else {
        const booking = await resolveCoachPayment.mutateAsync({
          bookingId: pendingPayment.id,
          result,
        });
        if (result === "approve") setCompletedBooking(booking);
      }
      setPendingPayment(null);
      if (result === "approve") {
        if (pendingPayment.source === "club") setReservationResult("success");
      } else {
        setReservationResult("failed");
      }
    } catch {
      setPendingPayment(null);
      setReservationResult("failed");
    }
  };
  if (completedBooking) {
    return (
      <CoachReservationSuccessScreen
        coach={coach}
        booking={completedBooking}
        phone={phone ?? undefined}
        cancelPending={cancelCoachBooking.isPending}
        onCall={() => {
          if (phone)
            window.location.href = `tel:${phone.replace(/[^+\d]/g, "")}`;
        }}
        onReschedule={() => {
          setCompletedBooking(null);
          requestAnimationFrame(() => {
            document
              .getElementById("coach-sessions")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }}
        onCancel={() => {
          if (!window.confirm("این رزرو لغو شود؟")) return;
          void cancelCoachBooking
            .mutateAsync({
              bookingId: completedBooking.id,
              reason: "لغو توسط ورزشکار",
            })
            .then(() => {
              toast.success("رزرو لغو شد و بازپرداخت طبق قوانین محاسبه شد");
              router.push("/athlete/reservations");
            })
            .catch(() => toast.danger("لغو رزرو انجام نشد؛ دوباره تلاش کنید"));
        }}
      />
    );
  }
  if (reservationResult) {
    return (
      <ReservationResultScreen
        status={reservationResult}
        entity={{
          kind: "coach",
          title: coach.displayName,
          subtitle: coach.shortBio || "مربی تأییدشده کلاب‌فورمی",
          meta: `${coach.averageRating.toLocaleString("fa-IR")} ★ · ${coach.experienceYears.toLocaleString("fa-IR")} سال تجربه`,
          imageUrl: coach.imageUrl,
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
              ? "/discovery/coaches"
              : "/athlete/reservations",
          )
        }
      />
    );
  }
  if (reviewSession) {
    return (
      <ReservationReviewScreen
        entity={{
          kind: "coach",
          title: coach.displayName,
          subtitle:
            reviewSession.offeringTitle ||
            coach.shortBio ||
            "مربی تأییدشده کلاب‌فورمی",
          imageUrl: coach.imageUrl,
          rating: coach.averageRating,
          reviewsCount: coach.reviewsCount,
        }}
        session={{
          title: reviewSession.title,
          startsAt: reviewSession.startAt,
          endsAt: reviewSession.endAt,
          deliveryMode: reviewSession.deliveryMode,
          address: reviewSession.venue?.address,
          participantCount: 1,
          amount: reviewSession.price?.amount ?? 0,
          currency: reviewSession.price?.currency ?? "IRR",
          cancellationPolicy: reviewSession.cancellationPolicy,
        }}
        isPending={book.isPending || bookClub.isPending}
        onBack={() => setReviewSession(null)}
        onConfirm={() => void reserve(reviewSession)}
      />
    );
  }
  return (
    <DetailLayout
      title={coach.displayName}
      subtitle={coach.shortBio}
      meta={`${coach.averageRating.toLocaleString("fa-IR")} ★ · ${coach.experienceYears.toLocaleString("fa-IR")} سال تجربه`}
      description={coach.shortBio || "اطلاعات این مربی به‌زودی تکمیل می‌شود."}
      imageUrl={coach.imageUrl}
      badge="پروفایل مربی"
      facts={coach.serviceModes.flatMap((mode) => {
        const label = (
          {
            club: "در باشگاه",
            online: "آنلاین",
            home: "در منزل",
            outdoor: "فضای باز",
          } as Record<string, string>
        )[mode];
        return label ? [label] : [];
      })}
      actionLabel={
        availableSessions.length > 0
          ? "انتخاب سانس"
          : phone
            ? "تماس با مربی"
            : "فعلاً سانس آزادی نیست"
      }
      actionHref={
        availableSessions.length > 0
          ? "#coach-sessions"
          : phone
            ? `tel:${phone}`
            : undefined
      }
      galleryHref={`/discovery/coaches/${id}/gallery`}
    >
      <CoachProfessionalSections coach={coach} section="introduction" />
      <DetailGallerySection
        title="نمونه‌کارها"
        images={coach.portfolio.map((image) => image.url)}
        viewAllHref={`/discovery/coaches/${id}/gallery`}
      />
      <CoachTrainingStylesSection items={coach.trainingStyles} />
      {coach.specialties.length ? (
        <Card className="app-card app-stack-card p-5 shadow-none">
          <Card.Title>تخصص‌ها</Card.Title>
          <div className="mt-3 divide-y divide-white/8">
            {coach.specialties.map((specialty, index) => (
              <div
                key={`${specialty.title}-${index}`}
                className="flex gap-4 py-4"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                  <Icon name="medal" size={22} />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {specialty.title}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-muted">
                    {specialty.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <CoachExperienceSection
        summary={coach.experienceSummary}
        items={coach.experience}
      />
      <CoachProfessionalSections coach={coach} section="experience" />
      <DetailSocialSection items={coachSocialLinks(coach.contact ?? {})} />
      <DetailFaqSection items={coach.faqs} />
      <section className="space-y-3">
        <ReviewSummary
          type="coach"
          average={coach.averageRating}
          count={coach.reviewsCount}
        />
        {!coach.reviewsCount ? (
          <ReviewEmptyState
            title="هنوز نظری برای این مربی ثبت نشده"
            description="پس از تمرین با این مربی، تجربه شما می‌تواند به انتخاب بهتر دیگران کمک کند."
          />
        ) : null}
        <ButtonLink
          href={`/discovery/coaches/${id}/reviews`}
          variant="secondary"
          className="w-full"
        >
          مشاهده و ثبت نظر
        </ButtonLink>
      </section>
      <Card
        id="coach-sessions"
        className="app-card app-stack-card scroll-mt-6 p-5 shadow-none"
      >
        <Card.Title>سانس‌های قابل رزرو</Card.Title>
        {sessions.isPending ? (
          <div className="mt-4">
            <CompactCardListSkeleton count={3} />
          </div>
        ) : availableSessions.length ? (
          <div className="mt-4 flex flex-col gap-3">
            {availableSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-white/8 bg-surface-secondary p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Typography type="body" weight="bold">
                      {session.title}
                    </Typography>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(session.startAt).toLocaleString("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {session.deliveryMode === "online" ? "آنلاین" : "حضوری"}
                      {" · "}
                      {(session.remainingCapacity ?? 0).toLocaleString(
                        "fa-IR",
                      )}{" "}
                      جای خالی
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-sm font-bold text-accent">
                      {(session.price?.amount ?? 0).toLocaleString("fa-IR")}{" "}
                      ریال
                    </p>
                    <Button
                      size="sm"
                      variant="primary"
                      className="mt-2"
                      isPending={book.isPending || bookClub.isPending}
                      onPress={() => setReviewSession(session)}
                    >
                      ادامه
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            فعلاً سانس آزادی ثبت نشده است.
          </p>
        )}
      </Card>
      {pendingPayment ? (
        <MockPaymentGateway
          title={pendingPayment.title}
          amount={pendingPayment.amount}
          isPending={
            resolveClubPayment.isPending || resolveCoachPayment.isPending
          }
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}
    </DetailLayout>
  );
}

function ClassDetails({ id }: { id: string }) {
  const query = useCatalogClass(id);
  const enrollments = useMyClassEnrollments();
  const enroll = useEnrollClass();
  const cancelEnrollment = useCancelClassEnrollment();
  const resolvePayment = useResolveMockClassPayment();
  const [showPayment, setShowPayment] = useState(false);
  if (query.isLoading || enrollments.isPending) return <Loading />;
  const item = query.data;
  if (!item) return <Missing retry={() => query.refetch()} />;
  const remaining = Math.max(0, item.capacity - item.enrollmentCount);
  const enrollment = (enrollments.data?.items ?? []).find(
    (candidate) => candidate.classId === item.id,
  );
  const registrationOpen =
    item.status === "published" &&
    remaining > 0 &&
    (!item.registrationStartAt ||
      new Date(item.registrationStartAt) <= new Date()) &&
    (!item.registrationEndAt || new Date(item.registrationEndAt) >= new Date());
  const enrollInClass = async () => {
    if (enrollment?.paymentStatus === "pending") {
      setShowPayment(true);
      return;
    }
    try {
      const result = await enroll.mutateAsync(item.id);
      if (result.paymentStatus === "pending") {
        setShowPayment(true);
      } else {
        toast.success(
          result.status === "active"
            ? "ثبت‌نام کلاس قطعی شد"
            : "درخواست ثبت‌نام برای مربی ارسال شد",
        );
      }
    } catch {
      toast.danger("ثبت‌نام انجام نشد؛ ظرفیت و بازه ثبت‌نام را بررسی کنید");
    }
  };
  const finishPayment = async (result: "approve" | "reject") => {
    const target =
      enrollment ??
      enrollments.data?.items.find((entry) => entry.classId === item.id);
    if (!target) return;
    try {
      const resolved = await resolvePayment.mutateAsync({
        enrollmentId: target.id,
        result,
      });
      setShowPayment(false);
      if (result === "reject") {
        toast.danger("پرداخت ناموفق بود و ظرفیت کلاس آزاد شد");
      } else if (resolved.status === "active") {
        toast.success("پرداخت موفق بود و ثبت‌نام قطعی شد");
      } else {
        toast.success("پرداخت موفق بود؛ درخواست در انتظار تأیید مربی است");
      }
    } catch {
      toast.danger("ثبت نتیجه پرداخت انجام نشد؛ دوباره تلاش کنید");
    }
  };
  const cancel = async () => {
    if (!enrollment || !window.confirm("ثبت‌نام این کلاس لغو شود؟")) return;
    try {
      await cancelEnrollment.mutateAsync(enrollment.id);
      toast.success("ثبت‌نام لغو و ظرفیت کلاس آزاد شد");
    } catch {
      toast.danger("لغو ثبت‌نام انجام نشد");
    }
  };
  const enrollmentActive =
    enrollment && ["active", "pending"].includes(enrollment.status);
  const actionLabel = enrollment
    ? enrollment.paymentStatus === "pending"
      ? "ادامه پرداخت"
      : enrollment.status === "active"
        ? "ثبت‌نام شده"
        : enrollment.status === "pending"
          ? "در انتظار تأیید مربی"
          : "ثبت‌نام بسته"
    : !registrationOpen
      ? remaining === 0
        ? "ظرفیت تکمیل است"
        : "ثبت‌نام بسته است"
      : item.price.amount > 0
        ? `ثبت‌نام، ${item.price.amount.toLocaleString("fa-IR")} ریال`
        : "ثبت‌نام رایگان";
  return (
    <DetailLayout
      title={item.title}
      subtitle={item.description}
      meta={`${remaining.toLocaleString("fa-IR")} ظرفیت باقی‌مانده`}
      description={item.description || "توضیحات این کلاس به‌زودی تکمیل می‌شود."}
      imageUrl={item.imageUrl}
      badge={item.status === "published" ? "ثبت‌نام باز" : "در حال برگزاری"}
      facts={[
        new Date(item.courseStartAt).toLocaleDateString("fa-IR"),
        item.deliveryMode === "online" ? "آنلاین" : "حضوری",
        `${item.enrollmentCount.toLocaleString("fa-IR")} شرکت‌کننده`,
      ]}
      actionLabel={actionLabel}
      onAction={
        enrollment?.paymentStatus === "pending" || !enrollment
          ? () => void enrollInClass()
          : undefined
      }
      actionDisabled={
        Boolean(enrollment && enrollment.paymentStatus !== "pending") ||
        (!enrollment && !registrationOpen)
      }
      actionPending={enroll.isPending || enrollments.isPending}
      galleryHref={`/discovery/classes/${id}/gallery`}
    >
      <DetailGallerySection
        images={item.imageUrl ? [item.imageUrl] : []}
        viewAllHref={`/discovery/classes/${id}/gallery`}
      />
      <DetailFaqSection items={item.faqs} />
      <section className="space-y-3">
        <ReviewSummary type="class" average={0} count={0} />
        <ReviewEmptyState
          title="هنوز نظری برای این کلاس ثبت نشده"
          description="اولین نفری باشید که تجربه شرکت در این کلاس را با دیگران به اشتراک می‌گذارد."
        />
        <ButtonLink
          href={`/discovery/classes/${id}/reviews`}
          variant="secondary"
          className="w-full"
        >
          مشاهده و ثبت نظر
        </ButtonLink>
      </section>
      <Card className="app-card app-stack-card p-5 shadow-none">
        <Card.Title>جزئیات ثبت‌نام</Card.Title>
        <div className="mt-4 grid gap-3 text-sm text-muted">
          <div className="flex items-center justify-between gap-4">
            <span>شهریه</span>
            <strong className="text-foreground">
              {item.price.amount > 0
                ? `${item.price.amount.toLocaleString("fa-IR")} ریال`
                : "رایگان"}
            </strong>
          </div>
          {item.venue?.address ? (
            <ButtonLink
              href={mapHref(item) ?? "#"}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              مشاهده محل برگزاری
            </ButtonLink>
          ) : null}
          {item.prerequisites.length ? (
            <div className="rounded-2xl bg-surface-secondary p-4">
              <p className="font-bold text-foreground">پیش‌نیازها</p>
              <p className="mt-2 leading-7">{item.prerequisites.join("، ")}</p>
            </div>
          ) : null}
          {enrollmentActive && new Date(item.courseStartAt) > new Date() ? (
            <Button
              variant="danger-soft"
              isPending={cancelEnrollment.isPending}
              onPress={() => void cancel()}
            >
              لغو ثبت‌نام
            </Button>
          ) : null}
        </div>
      </Card>
      {showPayment && enrollment?.paymentStatus === "pending" ? (
        <MockPaymentGateway
          title={item.title}
          amount={enrollment.priceSnapshot.amount}
          isPending={resolvePayment.isPending}
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}
    </DetailLayout>
  );
}

function DetailLayout({
  title,
  subtitle,
  meta,
  description,
  imageUrl,
  badge,
  facts,
  actionLabel,
  actionHref,
  onAction,
  actionDisabled,
  actionPending,
  galleryHref,
  children,
}: {
  title: string;
  subtitle: string;
  meta: string;
  description: string;
  imageUrl?: string | null;
  badge: string;
  facts: string[];
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionPending?: boolean;
  galleryHref?: string;
  children?: ReactNode;
}) {
  const galleryRouter = useRouter();
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const pullStartRef = useRef<number | null>(null);
  const galleryPullRef = useRef(0);
  const [galleryPull, setGalleryPull] = useState(0);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !galleryHref) return;
    const onTouchStart = (event: TouchEvent) => {
      const scrollRoot = media.closest(".app-scroll-root");
      if ((scrollRoot?.scrollTop ?? 0) <= 1 && event.touches.length === 1) {
        pullStartRef.current = event.touches[0]?.clientY ?? null;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      const start = pullStartRef.current;
      const current = event.touches[0]?.clientY;
      if (start === null || current === undefined) return;
      const distance = Math.max(0, current - start);
      if (!distance) return;
      event.preventDefault();
      const resisted = Math.min(76, distance * 0.55);
      galleryPullRef.current = resisted;
      setGalleryPull(resisted);
    };
    const onTouchEnd = () => {
      if (galleryPullRef.current >= 52) galleryRouter.push(galleryHref);
      pullStartRef.current = null;
      galleryPullRef.current = 0;
      setGalleryPull(0);
    };
    media.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    media.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    media.addEventListener("touchend", onTouchEnd, { capture: true });
    media.addEventListener("touchcancel", onTouchEnd, { capture: true });
    return () => {
      media.removeEventListener("touchstart", onTouchStart, { capture: true });
      media.removeEventListener("touchmove", onTouchMove, { capture: true });
      media.removeEventListener("touchend", onTouchEnd, { capture: true });
      media.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [galleryHref, galleryRouter]);

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-transparent pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <DiscoveryPageHeader title="" overlay />
      <div
        ref={mediaRef}
        className="app-scroll-media relative aspect-4/5 max-h-[62dvh] overflow-hidden bg-background"
      >
        {galleryHref ? (
          <div
            className="absolute inset-x-0 top-4 flex flex-col items-center gap-1 text-xs font-bold text-accent"
            aria-hidden
          >
            <Icon
              name="chevron-down"
              size={20}
              className={galleryPull >= 52 ? "rotate-180" : ""}
            />
            {galleryPull >= 52
              ? "رها کن و گالری را ببین"
              : "برای دیدن گالری بکش"}
          </div>
        ) : null}
        <div
          className="absolute inset-0 z-10 transition-transform duration-150 ease-out"
          style={{ transform: `translateY(${galleryPull}px)` }}
        >
          <FallbackImage
            src={imageUrl}
            alt={title}
            fill
            priority
            unoptimized
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover saturate-75"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-black/20" />
        </div>
      </div>
      <section className="relative -mt-16 flex flex-col gap-6 rounded-t-[2.25rem] border-t border-white/7 bg-background/94 px-5 pt-8 backdrop-blur-xl">
        <div className="app-reveal">
          <span className="mb-3 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
            {badge}
          </span>
          <Typography type="h2" weight="bold">
            {title}
          </Typography>
          <Typography type="body-sm" color="muted" className="mt-2">
            {subtitle}
          </Typography>
          <Typography type="body-sm" weight="bold" className="mt-3 text-accent">
            {meta}
          </Typography>
        </div>
        <Card className="app-card app-stack-card p-5 shadow-none">
          <Card.Title>درباره</Card.Title>
          <Card.Description className="mt-3 leading-7 text-muted">
            {description}
          </Card.Description>
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {facts.map((label, index) => (
            <div
              key={label}
              className="app-surface app-stack-card flex flex-col items-center gap-2 rounded-[1.3rem] p-4 text-center text-xs"
            >
              <Icon
                name={
                  (["calendar-1", "map-pin-1", "star-full"] as const)[index] ??
                  "star-full"
                }
                size={20}
                className="text-accent"
              />
              {label}
            </div>
          ))}
        </div>
        {children}
      </section>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-xl bg-linear-to-t from-background via-background to-transparent px-5 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {onAction ? (
          <Button
            variant="primary"
            size="lg"
            className="w-full whitespace-nowrap"
            isDisabled={actionDisabled}
            isPending={actionPending}
            onPress={onAction}
          >
            {actionLabel}
          </Button>
        ) : actionHref ? (
          <ButtonLink
            href={actionHref}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {actionLabel}
          </ButtonLink>
        ) : (
          <Button isDisabled variant="primary" size="lg" className="w-full">
            {actionLabel}
          </Button>
        )}
      </div>
    </main>
  );
}

function Loading() {
  return <DetailPageSkeleton />;
}

function Missing({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center text-muted">
      <p>مورد موردنظر پیدا نشد یا هنوز منتشر نشده است.</p>
      <Button size="sm" variant="secondary" onPress={retry}>
        تلاش دوباره
      </Button>
    </main>
  );
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function mapHref(item: PublicCatalogClass) {
  if (!item.venue?.address) return undefined;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.venue.address)}`;
}
