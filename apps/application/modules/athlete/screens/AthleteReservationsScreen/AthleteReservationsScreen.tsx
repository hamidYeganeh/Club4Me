"use client";

import { Button, Card, Spinner, toast } from "@heroui/react";
import { useCancelReservation, useMyReservations } from "@api";
import { useTranslations } from "next-intl";

import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";

export function AthleteReservationsScreen() {
  const nav = useTranslations("nav");
  const t = useTranslations("athleteReservations");
  const reservations = useMyReservations();
  const cancel = useCancelReservation();

  const cancelReservation = async (id: string) => {
    if (!window.confirm(t("cancelConfirm"))) return;
    try {
      const result = await cancel.mutateAsync(id);
      toast.success(
        t("cancelSuccess", {
          percent: result.refundPercent ?? 0,
          amount: (result.refundAmount ?? 0).toLocaleString("fa-IR"),
        }),
      );
    } catch {
      toast.danger(t("cancelError"));
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-36 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AthleteScreenHeaderSection title={nav("reservations")} />
      {reservations.isPending ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-3">
          {(reservations.data?.items ?? []).map((reservation) => (
            <Card
              key={reservation.id}
              variant="transparent"
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{reservation.sessionTitle}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(reservation.sessionStartsAt))}
                  </p>
                  <p className="mt-2 text-sm">
                    {t("total", {
                      amount: reservation.totalPrice.toLocaleString("fa-IR"),
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs">
                  {t(reservation.status)}
                </span>
              </div>
              {reservation.status === "reserved" && (
                <Button
                  className="mt-4"
                  variant="secondary"
                  isPending={cancel.isPending}
                  onPress={() => cancelReservation(reservation.id)}
                >
                  {t("cancel")}
                </Button>
              )}
              {reservation.status === "cancelled" && (
                <p className="mt-3 text-sm text-muted">
                  {t("refund", {
                    percent: reservation.refundPercent ?? 0,
                    amount: (reservation.refundAmount ?? 0).toLocaleString(
                      "fa-IR",
                    ),
                  })}
                </p>
              )}
            </Card>
          ))}
          {!reservations.data?.items.length && (
            <p className="py-16 text-center text-muted">{t("empty")}</p>
          )}
        </div>
      )}
    </main>
  );
}
