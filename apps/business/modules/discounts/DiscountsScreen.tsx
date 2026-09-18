"use client";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { useSelectedClub } from "@/lib/use-selected-club";
import { useBusinessDiscounts } from "@api/business";

export function DiscountsScreen() {
  const { clubs, clubId, setClubId } = useSelectedClub();
  const discounts = useBusinessDiscounts(clubId);
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">کدهای تخفیف</h1>
          <p className="mt-1 text-sm text-muted">
            تخفیف‌های محدود به باشگاه، بودجه و بازهٔ اعتبار
          </p>
        </div>
        <div className="flex gap-2">
          <FormSelect aria-label="باشگاه" value={clubId} onChange={setClubId}>
            {clubs.data?.items.map((club) => (
              <FormOption key={club.id} value={club.id}>
                {club.name}
              </FormOption>
            ))}
          </FormSelect>
          <Button variant="primary" isDisabled={!clubId}>
            <Link href={`/discounts/new?clubId=${clubId}`}>ساخت کد تخفیف</Link>
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {discounts.data?.items.map((item) => (
          <Card
            key={item.id}
            className="app-card p-5 shadow-none active:scale-100"
          >
            <div className="flex justify-between gap-2">
              <strong dir="ltr">{item.code}</strong>
              <span className="text-sm text-muted">
                {item.kind === "percent"
                  ? `${item.value}٪`
                  : `${item.value.toLocaleString("fa-IR")} ریال`}
              </span>
            </div>
            <p className="mt-2">{item.title}</p>
            <p className="mt-3 text-xs text-muted">
              استفاده: {item.usageCount.toLocaleString("fa-IR")} /{" "}
              {item.usageLimit?.toLocaleString("fa-IR") ?? "نامحدود"}
            </p>
            <p className="mt-1 text-xs text-muted">
              تا {new Date(item.endsAt).toLocaleDateString("fa-IR")}
            </p>
          </Card>
        ))}
      </div>
      {discounts.data?.items.length === 0 && (
        <p className="mt-8 text-center text-muted">
          هنوز کد تخفیفی ساخته نشده است.
        </p>
      )}
    </main>
  );
}
