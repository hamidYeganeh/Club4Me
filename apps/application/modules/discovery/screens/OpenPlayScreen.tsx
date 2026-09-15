"use client";

import { Button, Card } from "@heroui/react";
import { usePublicClubClasses } from "@api";
import { SecondaryHeader } from "../components/SecondaryHeader";
import { DiscoverySearchField } from "../components/DiscoverySearchField";
import { DiscoveryQueryState } from "../components/DiscoveryQueryState";
import { ClassBrowseCard } from "../components/ClassBrowseCard";
import { useDiscoveryList } from "../hooks/use-discovery-list";
import { DiscoveryResultCardSkeleton } from "@/components/loading-skeletons";

export function OpenPlayScreen() {
  const { query, setQuery, q, page, setPage } = useDiscoveryList();
  const result = usePublicClubClasses({
    classModel: "open",
    q,
    page,
    limit: 12,
  });
  return (
    <main className="app-page gap-6">
      <SecondaryHeader title="بازی آزاد" showFilter={false} />
      <Card className="space-y-3 p-6">
        <p className="text-xs text-accent">کنار هم بازی کنیم</p>
        <h1 className="text-2xl font-bold">یک جای خالی برای تو</h1>
        <p className="text-sm leading-7 text-muted">
          به بازی‌های عمومی باشگاه‌ها بپیوند. ظرفیت و زمان را ببین و ثبت‌نام کن؛
          هر نفر هزینهٔ ثبت‌نام خودش را جداگانه می‌پردازد.
        </p>
      </Card>
      <DiscoverySearchField
        value={query}
        onChange={setQuery}
        placeholder="نام بازی، ورزش یا سطح"
      />
      <DiscoveryQueryState query={result} />
      {result.isLoading ? <DiscoveryResultCardSkeleton count={3} /> : null}
      <div className="space-y-4">
        {result.data?.items.map((item) => (
          <ClassBrowseCard
            key={item.id}
            title={item.title}
            description={`${item.club.name} · ${item.level || "سطح آزاد"}`}
            remaining={item.remainingCapacity}
            price={item.price}
            currency={item.currency}
            startAt={item.startDate}
            href={`/discovery/business-class?classId=${item.id}`}
            badge="بازی آزاد · هزینه هر نفر"
          />
        ))}
      </div>
      {result.isSuccess && result.data.total === 0 ? (
        <Card className="p-6 text-center">
          <h2 className="font-bold">فعلاً بازی آزادی پیدا نشد</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            جست‌وجوی دیگری امتحان کن. بازی‌های عمومی جدید باشگاه‌ها در همین صفحه
            نمایش داده می‌شوند.
          </p>
        </Card>
      ) : null}
      {result.data && result.data.totalPages > 1 ? (
        <nav
          aria-label="صفحه‌های بازی آزاد"
          className="flex items-center justify-between gap-3"
        >
          <Button
            variant="secondary"
            isDisabled={page === 1 || result.isFetching}
            onPress={() => setPage(page - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            صفحه {page.toLocaleString("fa-IR")}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= result.data.totalPages || result.isFetching}
            onPress={() => setPage(page + 1)}
          >
            بعدی
          </Button>
        </nav>
      ) : null}
    </main>
  );
}
