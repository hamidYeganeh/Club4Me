"use client";
import { useQuery } from "@tanstack/react-query";
import { http } from "@api/http/client";
import { Button } from "@heroui/react";
import { useState } from "react";
import Link from "next/link";

type FollowUp = {
  studentId: string;
  name: string;
  phone: string;
  reasons: string[];
  note: string;
  deferred: boolean;
  nextFollowUpAt: string | null;
};
export function MemberFollowUps({ clubId }: { clubId: string }) {
  const key = ["business", clubId, "member-follow-ups"];
  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      http.get<{ items: FollowUp[] }>(
        `/business/clubs/${clubId}/operations/follow-ups`,
      ),
  });
  const [showDeferred, setShowDeferred] = useState(false);
  const [limit, setLimit] = useState(5);
  const items = (query.data?.items ?? []).filter(
    (item) => showDeferred || !item.deferred,
  );
  return (
    <section
      className="mt-4 space-y-3 rounded-2xl p-4"
      aria-label="پیگیری اعضای باشگاه"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">پیگیری اعضا</h3>
        <Button
          size="sm"
          variant="ghost"
          onPress={() => setShowDeferred((v) => !v)}
        >
          {showDeferred
            ? "فقط نیازمند پیگیری"
            : "نمایش پیگیری‌های زمان‌بندی‌شده"}
        </Button>
      </div>
      <p className="text-xs leading-6 text-muted">
        انقضای عضویت و نبود حضور ثبت‌شده. نتیجه تماس را ثبت کنید تا هفت روز بعد
        دوباره یادآوری شود.
      </p>
      {query.isPending && <p role="status">در حال دریافت اعضا…</p>}
      {query.isError && (
        <div role="alert">
          <p className="text-sm">
            دریافت پیگیری انجام نشد؛ دسترسی اعضا و حضور لازم است.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void query.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      )}
      {query.isSuccess && !items.length && (
        <p className="text-sm text-muted">
          موردی برای پیگیری در این فهرست نیست.
        </p>
      )}
      {items.slice(0, limit).map((item) => (
        <div
          key={item.studentId}
          className="rounded-xl bg-surface-secondary p-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold">{item.name}</h4>
              <p className="mt-1 text-xs leading-6 text-muted">
                {item.reasons.join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex min-h-11 items-center text-sm text-accent"
                href={`/students?query=${encodeURIComponent(item.phone)}`}
              >
                پرونده و تمدید ←
              </Link>
              <Button size="sm" variant="secondary">
                <Link
                  href={`/students/${item.studentId}/follow-up?clubId=${clubId}`}
                >
                  ثبت نتیجه پیگیری
                </Link>
              </Button>
            </div>
          </div>
          {item.note && (
            <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
              آخرین پیگیری: {item.note}
            </p>
          )}
          {item.deferred && item.nextFollowUpAt && (
            <p className="mt-1 text-xs text-muted">
              پیگیری بعدی:{" "}
              {new Date(item.nextFollowUpAt).toLocaleDateString("fa-IR", {
                timeZone: "Asia/Tehran",
              })}
            </p>
          )}
        </div>
      ))}
      {items.length > limit && (
        <Button variant="ghost" onPress={() => setLimit((v) => v + 20)}>
          نمایش موارد بیشتر ({(items.length - limit).toLocaleString("fa-IR")})
        </Button>
      )}
    </section>
  );
}
