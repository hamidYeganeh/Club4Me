"use client";

import { FormEvent, useState } from "react";
import { Button, Card, Typography, toast } from "@heroui/react";
import {
  useClubReviews,
  useCreateClubReview,
  useReservableSessions,
  useReserveSession,
  useResolveMockClubPayment,
} from "@api";
import { useTranslations } from "next-intl";

import { MockPaymentGateway } from "@modules/payments/components/MockPaymentGateway";
import {
  CompactCardListSkeleton,
  ReviewListSkeleton,
} from "@/components/loading-skeletons";

const field =
  "h-11 w-full rounded-xl border border-border bg-surface-secondary px-3 text-sm outline-none focus:border-accent";

export function ClubReservationsAndReviewsSection({
  clubId,
}: {
  clubId: string;
}) {
  const t = useTranslations("discovery.clubBooking");
  const sessions = useReservableSessions(clubId);
  const reviews = useClubReviews(clubId);
  const reserve = useReserveSession();
  const resolvePayment = useResolveMockClubPayment();
  const createReview = useCreateClubReview(clubId);
  const [participants, setParticipants] = useState<Record<string, number>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [pendingPayment, setPendingPayment] = useState<{
    id: string;
    title: string;
    amount: number;
  } | null>(null);

  const book = async (sessionId: string, optionIds: string[]) => {
    try {
      const result = await reserve.mutateAsync({
        sessionId,
        participantCount: participants[sessionId] ?? 1,
        options: optionIds
          .map((optionId) => ({
            optionId,
            quantity: quantities[optionId] ?? 0,
          }))
          .filter((item) => item.quantity > 0),
      });
      if (result.paymentStatus === "pending") {
        setPendingPayment({
          id: result.id,
          title: result.sessionTitle,
          amount: result.totalPrice,
        });
      } else {
        toast.success(t("reserved"));
      }
    } catch {
      toast.danger(t("reserveError"));
    }
  };

  const finishPayment = async (result: "approve" | "reject") => {
    if (!pendingPayment) return;
    try {
      await resolvePayment.mutateAsync({
        reservationId: pendingPayment.id,
        result,
      });
      if (result === "approve") {
        toast.success("پرداخت آزمایشی موفق بود و رزرو قطعی شد");
      } else {
        toast.danger("پرداخت ناموفق بود و ظرفیت رزرو آزاد شد");
      }
      setPendingPayment(null);
    } catch {
      toast.danger("ثبت نتیجه پرداخت انجام نشد");
    }
  };

  const sendReview = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await createReview.mutateAsync({ rating, body: reviewBody });
      setReviewBody("");
      toast.success(t("reviewSent"));
    } catch {
      toast.danger(t("reviewError"));
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-8 px-4 pb-8">
      {pendingPayment ? (
        <MockPaymentGateway
          title={pendingPayment.title}
          amount={pendingPayment.amount}
          isPending={resolvePayment.isPending}
          onResult={(result) => void finishPayment(result)}
        />
      ) : null}
      <div>
        <Typography type="h4">{t("sessions")}</Typography>
        {sessions.isPending ? (
          <div className="mt-4">
            <CompactCardListSkeleton count={2} />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(sessions.data?.items ?? []).map((session) => (
              <Card
                key={session.id}
                className="rounded-2xl border border-border p-4"
                variant="transparent"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Typography type="h6">{session.title}</Typography>
                    <Typography type="body-sm" color="muted" className="mt-1">
                      {new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(session.startsAt))}
                    </Typography>
                  </div>
                  <span className="text-sm">
                    {t("remaining", {
                      count: session.capacity - session.reservedCount,
                    })}
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {session.options.map((option) => {
                    const available =
                      option.availableQuantity - option.reservedQuantity;
                    return (
                      <label
                        key={option.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span>
                          {option.title ?? t(option.type)} ·{" "}
                          {option.unitPrice.toLocaleString("fa-IR")}
                        </span>
                        <input
                          aria-label={option.title ?? t(option.type)}
                          className="h-9 w-20 rounded-lg border border-border px-2"
                          type="number"
                          min={0}
                          max={Math.min(option.maxPerReservation, available)}
                          value={quantities[option.id] ?? 0}
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [option.id]: Number(event.target.value),
                            }))
                          }
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    aria-label={t("participants")}
                    className="h-10 w-20 rounded-lg border border-border px-2"
                    type="number"
                    min={1}
                    max={session.capacity - session.reservedCount}
                    value={participants[session.id] ?? 1}
                    onChange={(event) =>
                      setParticipants((current) => ({
                        ...current,
                        [session.id]: Number(event.target.value),
                      }))
                    }
                  />
                  <Button
                    variant="primary"
                    isPending={reserve.isPending}
                    onPress={() =>
                      book(
                        session.id,
                        session.options.map((item) => item.id),
                      )
                    }
                  >
                    {t("reserve")} · {session.basePrice.toLocaleString("fa-IR")}
                  </Button>
                </div>
                <Typography type="body-xs" color="muted" className="mt-3">
                  {t("policy", { title: session.cancellationPolicy.title })}
                </Typography>
              </Card>
            ))}
            {!sessions.data?.items.length && (
              <Typography type="body-sm" color="muted">
                {t("noSessions")}
              </Typography>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-end justify-between">
          <Typography type="h4">{t("reviews")}</Typography>
          <Typography type="body-sm" color="muted">
            {t("ratingSummary", {
              rating: (reviews.data?.averageRating ?? 0).toFixed(1),
              count: reviews.data?.reviewsCount ?? 0,
            })}
          </Typography>
        </div>
        <form
          onSubmit={sendReview}
          className="mt-4 grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-[120px_1fr_auto]"
        >
          <select
            className={field}
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {t("stars", { count: value })}
              </option>
            ))}
          </select>
          <input
            className={field}
            value={reviewBody}
            onChange={(event) => setReviewBody(event.target.value)}
            placeholder={t("reviewPlaceholder")}
          />
          <Button
            type="submit"
            variant="primary"
            isPending={createReview.isPending}
          >
            {t("sendReview")}
          </Button>
        </form>
        <div className="mt-3 space-y-2">
          {reviews.isPending ? <ReviewListSkeleton count={2} /> : null}
          {!reviews.isPending && (reviews.data?.items ?? []).map((review) => (
            <article
              key={review.id}
              className="rounded-2xl bg-surface-secondary p-4"
            >
              <Typography type="body-sm" weight="semibold">
                {t("stars", { count: review.rating })}
              </Typography>
              {review.title && (
                <Typography type="h6" weight="medium" className="mt-2">
                  {review.title}
                </Typography>
              )}
              {review.body && (
                <Typography type="body-sm" color="muted" className="mt-1">
                  {review.body}
                </Typography>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
