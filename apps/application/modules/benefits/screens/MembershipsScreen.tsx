"use client";
import { MembershipActions } from "./MembershipActions";
import { useState } from "react";
import Link from "@/components/app-link";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import {
  useMyEntitlements,
  useEntitlementUsage,
  type UserEntitlement,
} from "@api";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
const statusLabels = {
  active: "فعال",
  exhausted: "جلسات تمام شده",
  expired: "منقضی",
  revoked: "لغوشده",
};
const sessionLabels: Record<string, string> = {
  court: "زمین",
  class: "کلاس",
  coached_session: "سانس مربی",
};
export function MembershipsScreen({
  entitlementId,
}: { entitlementId?: string } = {}) {
  const query = useMyEntitlements();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [now] = useState(() => Date.now());
  const active = (item: UserEntitlement) =>
    item.status === "active" && new Date(item.endsAt).getTime() > now;
  const items = (query.data?.items ?? []).filter((item) =>
    entitlementId
      ? item.id === entitlementId
      : active(item) === (tab === "active"),
  );
  return (
    <main className="app-page gap-5">
      <SecondaryHeader
        title={entitlementId ? "جزئیات عضویت" : "بسته‌ها و عضویت‌های من"}
        showFilter={false}
        backHref={entitlementId ? "/athlete/memberships" : "/athlete"}
      />
      {!entitlementId ? (
        <div className="flex gap-3">
          <Button
            variant={tab === "active" ? "primary" : "secondary"}
            onPress={() => setTab("active")}
          >
            فعال
          </Button>
          <Button
            variant={tab === "history" ? "primary" : "secondary"}
            onPress={() => setTab("history")}
          >
            سوابق
          </Button>
        </div>
      ) : null}
      {query.isPending ? (
        <div className="grid min-h-52 place-items-center">
          <Spinner />
        </div>
      ) : query.isError ? (
        <Card className="p-5">
          <p role="alert">دریافت عضویت‌ها انجام نشد.</p>
          <Button onPress={() => void query.refetch()}>تلاش دوباره</Button>
        </Card>
      ) : !items.length ? (
        <Card className="p-5">
          <p>
            {entitlementId
              ? "این عضویت در حساب شما در دسترس نیست."
              : tab === "active"
                ? "بسته یا عضویت فعالی ندارید."
                : "سابقه‌ای وجود ندارد."}
          </p>
          <Link
            href="/discovery/clubs"
            className="mt-4 inline-flex min-h-11 items-center text-accent"
          >
            مشاهده باشگاه‌ها
          </Link>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="app-card space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <Card.Title>{item.title}</Card.Title>
              <Chip>
                {active(item)
                  ? item.pauseUntil && new Date(item.pauseUntil).getTime() > now
                    ? "در توقف"
                    : new Date(item.startsAt).getTime() > now
                      ? "شروع در آینده"
                      : "فعال"
                  : statusLabels[
                      item.status === "active" ? "expired" : item.status
                    ]}
              </Chip>
            </div>
            <dl className="space-y-3 text-sm">
              <Row
                label="نوع"
                value={
                  item.type === "session_pack" ? "بسته جلسه‌ای" : "عضویت زمانی"
                }
              />
              {item.remainingSessions != null ? (
                <Row
                  label="جلسات باقی‌مانده"
                  value={item.remainingSessions.toLocaleString("fa-IR")}
                />
              ) : null}
              <Row
                label="شروع اعتبار"
                value={new Date(item.startsAt).toLocaleDateString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })}
              />
              <Row
                label="پایان اعتبار"
                value={new Date(item.endsAt).toLocaleDateString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })}
              />
              {item.weeklyLimit != null ? (
                <>
                  <Row
                    label="سقف جلسات هفتگی"
                    value={item.weeklyLimit.toLocaleString("fa-IR")}
                  />
                  <Row
                    label="مبنای هفته"
                    value={
                      item.weekCalendar === "iran_saturday"
                        ? "شنبه تا جمعه، ساعت تهران"
                        : "دوشنبه تا یکشنبه، UTC (قرارداد قبلی)"
                    }
                  />
                  <Row
                    label="مصرف هفته جاری"
                    value={item.weeklyUsed.toLocaleString("fa-IR")}
                  />
                </>
              ) : null}
              <Row
                label="قابل استفاده برای"
                value={item.sessionTypes
                  .map((type) => sessionLabels[type] ?? type)
                  .join("، ")}
              />
            </dl>
            <MembershipActions item={item} />
            <Link
              href={`/discovery/clubs/${item.clubId}/slots`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-accent-foreground"
            >
              {active(item) ? "رزرو با این عضویت" : "مشاهده سانس‌های باشگاه"}
            </Link>
            {entitlementId ? (
              <MembershipUsage entitlementId={item.id} />
            ) : (
              <Link
                href={`/athlete/memberships/${item.id}`}
                className="inline-flex min-h-11 items-center font-bold"
              >
                جزئیات و سوابق مصرف
              </Link>
            )}
          </Card>
        ))
      )}
    </main>
  );
}
function MembershipUsage({ entitlementId }: { entitlementId: string }) {
  const expanded = true;
  const [page, setPage] = useState(1);
  const query = useEntitlementUsage(expanded ? entitlementId : "", page);
  const labels = {
    reserved: "در انتظار تأیید",
    consumed: "مصرف‌شده",
    released: "برگشت اعتبار",
  };
  return (
    <section className="space-y-3">
      <h2 className="font-bold">سوابق مصرف عضویت</h2>
      {expanded ? (
        <div id={`usage-${entitlementId}`} className="space-y-3">
          {query.isPending ? (
            <Spinner aria-label="دریافت سوابق مصرف" />
          ) : query.isError ? (
            <div role="alert">
              <p>دریافت سوابق انجام نشد.</p>
              <Button onPress={() => void query.refetch()}>تلاش دوباره</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted">
                {(query.data?.total ?? 0).toLocaleString("fa-IR")} سابقه؛ هر
                رزرو یک جلسه از اعتبار استفاده می‌کند.
              </p>
              {!query.data?.items.length ? (
                <p>هنوز مصرفی ثبت نشده است.</p>
              ) : (
                <ul className="space-y-3">
                  {query.data.items.map((usage) => (
                    <li
                      key={usage.id}
                      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"
                    >
                      <div>
                        <time dateTime={usage.sessionStartsAt}>
                          {new Date(usage.sessionStartsAt).toLocaleString(
                            "fa-IR",
                            {
                              timeZone: "Asia/Tehran",
                              dateStyle: "medium",
                              timeStyle: "short",
                            },
                          )}
                        </time>
                        <p className="text-sm text-muted">
                          {labels[usage.status]}
                        </p>
                      </div>
                      <Link
                        href={`/athlete/reservations/${usage.reservationId}`}
                        className="inline-flex min-h-11 items-center text-accent"
                      >
                        جزئیات رزرو
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {(query.data?.totalPages ?? 0) > 1 ? (
                <nav
                  aria-label="صفحه‌بندی سوابق مصرف"
                  className="flex items-center justify-between gap-2"
                >
                  <Button
                    variant="secondary"
                    isDisabled={page === 1}
                    onPress={() => setPage((value) => value - 1)}
                  >
                    قبلی
                  </Button>
                  <span>
                    صفحه {page.toLocaleString("fa-IR")} از{" "}
                    {query.data?.totalPages.toLocaleString("fa-IR")}
                  </span>
                  <Button
                    variant="secondary"
                    isDisabled={page >= (query.data?.totalPages ?? 1)}
                    onPress={() => setPage((value) => value + 1)}
                  >
                    بعدی
                  </Button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-bold">{value}</dd>
    </div>
  );
}
