"use client";
import { MemberFollowUps } from "./MemberFollowUps";
import { useQuery } from "@tanstack/react-query";
import { http } from "@api/http/client";
import { Button } from "@heroui/react";
import Link from "next/link";

type Capacity = {
  id: string;
  title: string;
  remainingCapacity: number;
  waitlisted: number;
  offers: number;
  recovered: number;
};
export function BusinessToday({
  clubId,
  clubName,
}: {
  clubId: string;
  clubName: string;
}) {
  const query = useQuery({
    queryKey: ["business", clubId, "capacity"],
    queryFn: () =>
      http.get<{ items: Capacity[] }>(
        `/business/clubs/${clubId}/operations/capacity`,
      ),
  });
  return (
    <section
      className="mt-6 rounded-3xl border border-accent/20 bg-surface p-5"
      aria-label="کارهای امروز باشگاه"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted">باشگاه فعال: {clubName}</p>
          <h2 className="mt-2 text-xl font-bold">
            امروز چه چیزی نیاز به پیگیری دارد؟
          </h2>
        </div>
        <Link
          href="/reception"
          className="inline-flex min-h-12 items-center rounded-2xl bg-accent px-5 text-sm font-bold text-accent-foreground"
        >
          پذیرش و ثبت حضور ←
        </Link>
      </div>
      <MemberFollowUps key={clubId} clubId={clubId} />
      <section className="mt-5 space-y-3" aria-label="ظرفیت و لیست انتظار">
        <h3 className="font-semibold">ظرفیت و لیست انتظار</h3>
        <p className="text-xs leading-6 text-muted">
          جای خالی به ترتیب درخواست و با فرصت ۱۵ دقیقه‌ای اعلام می‌شود. «بازگشته
          از انتظار» تعداد ثبت‌نام‌های فعال با سابقه انتظار است.
        </p>
        {query.isPending && (
          <p role="status" className="text-sm">
            در حال دریافت ظرفیت…
          </p>
        )}
        {query.isError && (
          <div role="alert">
            <p className="text-sm">
              دریافت ظرفیت انجام نشد؛ دسترسی کلاس‌ها و ثبت‌نام‌ها لازم است.
            </p>
            <Button variant="ghost" onPress={() => void query.refetch()}>
              تلاش دوباره
            </Button>
          </div>
        )}
        {query.data?.items.map((item) => (
          <Link
            key={item.id}
            href={`/clubs/${clubId}/classes/${item.id}`}
            className="block rounded-2xl bg-surface-secondary p-4"
          >
            <h4 className="text-sm font-semibold">{item.title} ←</h4>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
              <span>
                {item.remainingCapacity.toLocaleString("fa-IR")} جای خالی
              </span>
              <span>{item.waitlisted.toLocaleString("fa-IR")} در انتظار</span>
              <span>{item.offers.toLocaleString("fa-IR")} فرصت پذیرش فعال</span>
              <span>
                {item.recovered.toLocaleString("fa-IR")} بازگشته از انتظار
              </span>
            </p>
          </Link>
        ))}
        {query.isSuccess && !query.data.items.length && (
          <p className="text-sm text-muted">
            در حال حاضر ظرفیت یا لیست انتظاری برای پیگیری وجود ندارد.
          </p>
        )}
        <Link
          href="/calendar"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
        >
          مشاهده تقویم باشگاه ←
        </Link>
      </section>
    </section>
  );
}
