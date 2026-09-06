"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { usePublicBenefitProducts, usePurchaseBenefitProduct } from "@api";
import { Button, Card, Chip, Skeleton, toast } from "@heroui/react";
import { CompactCardListSkeleton } from "@/components/loading-skeletons";

export function ClubBenefitProductsSection({ clubId }: { clubId: string }) {
  const products = usePublicBenefitProducts(clubId);
  const purchase = usePurchaseBenefitProduct();
  if (products.isPending)
    return (
      <section className="space-y-4 px-4 py-5" aria-label="بسته‌ها و عضویت‌ها">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-3 w-56 max-w-full rounded-lg" />
        </div>
        <CompactCardListSkeleton count={2} />
      </section>
    );

  return (
    <section className="px-4 py-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold">بسته‌ها و عضویت‌ها</h2>
        <p className="mt-1 text-xs text-muted">
          یک‌بار بخرید و هنگام رزرو استفاده کنید
        </p>
      </div>
      {products.isError ? (
        <div className="app-surface rounded-3xl p-5 text-center text-sm text-muted">
          دریافت بسته‌ها و عضویت‌ها انجام نشد.
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onPress={() => void products.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : !products.data?.items.length ? (
        <ClubEmptyState
          title="هنوز بسته یا عضویتی ارائه نشده است"
          description="بسته‌های جلسه و عضویت‌های این باشگاه پس از انتشار اینجا نمایش داده می‌شوند."
        />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {(products.data?.items ?? []).map((item) => (
          <Card key={item.id} className="app-card rounded-3xl p-5 shadow-none">
            <Chip size="sm" variant="soft">
              {item.type === "session_pack" ? "بسته جلسه" : "عضویت زمانی"}
            </Chip>
            <h3 className="mt-3 font-bold">{item.title}</h3>
            <p className="mt-2 text-xs leading-6 text-muted">
              {item.description}
            </p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {item.type === "session_pack"
                ? `${item.sessionCount} جلسه با ${item.validityDays} روز اعتبار`
                : `هفته‌ای ${item.weeklyLimit} مرتبه تا ${item.validityDays} روز`}
            </p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <strong>{item.price.toLocaleString("fa-IR")} ریال</strong>
              <Button
                size="sm"
                variant="primary"
                isPending={purchase.isPending}
                onPress={async () => {
                  try {
                    await purchase.mutateAsync(item.id);
                    toast.success("خرید موفق بود و عضویت فعال شد");
                  } catch {
                    toast.danger("خرید انجام نشد");
                  }
                }}
              >
                خرید
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
