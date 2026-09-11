"use client";

import { Counter } from "@/components/counter";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  usePauseEntitlement,
  useResumeEntitlement,
  type UserEntitlement,
} from "@api";
import { ClubBenefitProductsSection } from "@modules/discovery/sections/ClubBenefitProductsSection";
import { useNow } from "@/lib/use-now";

export function MembershipActions({ item }: { item: UserEntitlement }) {
  const pause = usePauseEntitlement(),
    resume = useResumeEntitlement();
  const [days, setDays] = useState("1"),
    [renew, setRenew] = useState(false);
  const [error, setError] = useState("");
  const now = useNow();
  const paused = Boolean(
    now !== null &&
    item.pauseUntil &&
    new Date(item.pauseUntil).getTime() > now,
  );
  const availableDays = Math.floor(item.remainingPauseDays ?? 0);
  const canPause =
    item.status === "active" &&
    now !== null &&
    new Date(item.startsAt).getTime() <= now &&
    new Date(item.endsAt).getTime() > now;
  const act = async (action: "pause" | "resume") => {
    setError("");
    try {
      if (action === "resume") await resume.mutateAsync(item.id);
      else
        await pause.mutateAsync({
          id: item.id,
          days: Number(
            days.replace(/[۰-۹٠-٩]/g, (d) =>
              String(
                "۰۱۲۳۴۵۶۷۸۹".includes(d)
                  ? "۰۱۲۳۴۵۶۷۸۹".indexOf(d)
                  : "٠١٢٣٤٥٦٧٨٩".indexOf(d),
              ),
            ),
          ),
        });
      toast.success(
        action === "pause"
          ? "توقف ثبت شد و پایان اعتبار تغییر کرد"
          : "عضویت از توقف خارج شد",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "تغییر عضویت انجام نشد");
    }
  };
  return (
    <div className="space-y-4 border-t border-border pt-4">
      {paused ? (
        <div className="space-y-3">
          <p>
            توقف تا{" "}
            {new Intl.DateTimeFormat("fa-IR", {
              timeZone: "Asia/Tehran",
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(item.pauseUntil!))}
          </p>
          <p className="text-sm text-muted">
            بازگشت زودتر، روزهای استفاده‌نشدهٔ توقف را از پایان اعتبار کم
            می‌کند.
          </p>
          <Button
            variant="secondary"
            isPending={resume.isPending}
            onPress={() => void act("resume")}
          >
            بازگشت از توقف
          </Button>
        </div>
      ) : canPause && availableDays > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            تا {availableDays.toLocaleString("fa-IR")} روز توقف مجاز. پایان
            اعتبار به همین مدت جابه‌جا می‌شود. بازه توقف باید بدون رزرو باشد.
          </p>
          <label className="grid gap-2 text-sm">
            مدت توقف (روز)
            <Counter
              aria-label="مدت توقف (روز)"
              className="min-h-11 rounded-xl border border-border bg-surface px-3"
              min={1}
              max={availableDays}
              disabled={pause.isPending}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            isPending={pause.isPending}
            onPress={() => void act("pause")}
          >
            ثبت توقف عضویت
          </Button>
        </div>
      ) : null}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {item.status !== "revoked" && (
        <Button variant="secondary" onPress={() => setRenew((v) => !v)}>
          {renew ? "بستن گزینه‌های تمدید" : "تمدید یا انتخاب پلن جدید"}
        </Button>
      )}
      {renew && (
        <ClubBenefitProductsSection
          clubId={item.clubId}
          renewedFromId={item.id}
        />
      )}
      {!!item.changes?.length && (
        <details>
          <summary className="min-h-11 cursor-pointer py-3 text-sm">
            تاریخچه تغییرات قرارداد
          </summary>
          <ul className="space-y-3 text-sm">
            {item.changes.map((change, index) => (
              <li key={index} className="border-t border-border pt-3">
                {
                  (
                    {
                      pause: "توقف",
                      resume: "بازگشت",
                      renewal: "تمدید",
                    } as const
                  )[change.action]
                }{" "}
                ·{" "}
                {new Intl.DateTimeFormat("fa-IR", {
                  timeZone: "Asia/Tehran",
                  dateStyle: "short",
                }).format(new Date(change.at))}
                <p className="text-muted">
                  پایان اعتبار:{" "}
                  {new Date(change.beforeEndsAt).toLocaleDateString("fa-IR", {
                    timeZone: "Asia/Tehran",
                  })}{" "}
                  ←{" "}
                  {new Date(change.afterEndsAt).toLocaleDateString("fa-IR", {
                    timeZone: "Asia/Tehran",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
