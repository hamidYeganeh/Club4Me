"use client";

import { Card, Skeleton } from "@heroui/react";

type CountProps = { count?: number };

const loadingProps = {
  "aria-busy": true,
  "aria-label": "در حال بارگذاری محتوا",
  role: "status" as const,
};

export function SkeletonLine({ className = "w-full" }: { className?: string }) {
  return <Skeleton className={`h-3.5 rounded-lg ${className}`} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex min-h-20 items-end justify-between gap-4 pb-2 pt-[env(safe-area-inset-top)]">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-3 w-48 max-w-full rounded-lg" />
      </div>
      <Skeleton className="size-11 shrink-0 rounded-full" />
    </div>
  );
}

export function DiscoveryResultCardSkeleton({ count = 3 }: CountProps) {
  return (
    <div className="flex flex-col gap-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="app-card app-stack-card flex min-h-29 flex-row items-center gap-3 overflow-hidden p-3 shadow-none"
        >
          <Skeleton className="size-22 shrink-0 rounded-[1.15rem]" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-4 w-2/3 rounded-lg" />
            <Skeleton className="h-3.5 w-full rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-lg" />
          </div>
          <Skeleton className="size-5 shrink-0 rounded-full" />
        </Card>
      ))}
    </div>
  );
}

export function CompactCardListSkeleton({ count = 2 }: CountProps) {
  return (
    <div className="flex flex-col gap-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="app-card rounded-2xl p-4 shadow-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-4 w-3/5 rounded-lg" />
              <Skeleton className="h-3 w-4/5 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/7 pt-3">
            <Skeleton className="h-3 w-28 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TileGridSkeleton({ count = 4 }: CountProps) {
  return (
    <div className="grid grid-cols-2 gap-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="app-card min-h-36 rounded-2xl p-4 shadow-none">
          <Skeleton className="size-11 rounded-2xl" />
          <div className="mt-5 space-y-2.5">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-2/3 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function HorizontalRailSkeleton({ count = 3 }: CountProps) {
  return (
    <div className="flex gap-3 overflow-hidden" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className="app-card w-[15.5rem] shrink-0 overflow-hidden rounded-[1.5rem] p-0 shadow-none"
        >
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2.5 p-4">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SectionSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <section className="flex flex-col gap-4" {...loadingProps}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-3 w-48 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16 rounded-xl" />
      </div>
      <HorizontalRailSkeleton count={cards} />
    </section>
  );
}

export function ListPageSkeleton({ count = 4 }: CountProps) {
  return (
    <main className="app-page gap-6" {...loadingProps}>
      <PageHeaderSkeleton />
      <Skeleton className="h-13 w-full rounded-[1.15rem]" />
      <div className="flex gap-2 overflow-hidden">
        <Skeleton className="h-9 w-20 shrink-0 rounded-full" />
        <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
        <Skeleton className="h-9 w-28 shrink-0 rounded-full" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
      <DiscoveryResultCardSkeleton count={count} />
    </main>
  );
}

export function DetailPageSkeleton() {
  return (
    <main className="min-h-dvh bg-background pb-12" {...loadingProps}>
      <div className="relative aspect-[4/5] max-h-[32rem]">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-5 top-[calc(1rem+env(safe-area-inset-top))] flex justify-between">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
        <div className="absolute inset-x-5 bottom-8 space-y-3">
          <Skeleton className="h-7 w-2/3 rounded-xl" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
      </div>
      <div className="relative -mt-6 space-y-5 rounded-t-[2rem] bg-background px-5 pt-7">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="app-card space-y-2 rounded-2xl p-3 text-center">
              <Skeleton className="mx-auto size-6 rounded-full" />
              <Skeleton className="mx-auto h-4 w-12 rounded-lg" />
              <Skeleton className="mx-auto h-3 w-16 rounded-lg" />
            </div>
          ))}
        </div>
        <Card className="app-card space-y-3 rounded-3xl p-5 shadow-none">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine className="w-3/4" />
        </Card>
        <CompactCardListSkeleton count={2} />
      </div>
    </main>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <main className="min-h-dvh bg-background pb-12" {...loadingProps}>
      <div className="relative aspect-[4/5] max-h-[34rem]">
        <Skeleton className="absolute inset-0 rounded-none" />
        <Skeleton className="absolute right-5 top-[calc(1rem+env(safe-area-inset-top))] size-11 rounded-full" />
        <div className="absolute inset-x-5 bottom-8 space-y-3">
          <Skeleton className="h-8 w-5/6 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 px-5 py-6">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
        <div className="space-y-3 pt-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonLine key={index} className={index % 3 === 2 ? "w-3/4" : "w-full"} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function ArticleListSkeleton({ count = 4 }: CountProps) {
  return (
    <div className="grid gap-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="app-card flex min-h-36 overflow-hidden rounded-2xl p-3 shadow-none">
          <Skeleton className="h-full min-h-28 w-28 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2.5 p-2">
            <Skeleton className="h-4 w-4/5 rounded-lg" />
            <SkeletonLine />
            <SkeletonLine className="w-3/4" />
            <Skeleton className="mt-4 h-3 w-24 rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function CityCatalogSkeleton() {
  return (
    <div className="space-y-8" {...loadingProps}>
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <section key={groupIndex} className="space-y-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((__, index) => (
              <div key={index} className="w-44 shrink-0 space-y-2">
                <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-3 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function CityDetailSkeleton() {
  return (
    <main className="min-h-dvh bg-background" {...loadingProps}>
      <div className="relative h-[23rem]">
        <Skeleton className="absolute inset-0 rounded-none" />
        <Skeleton className="absolute right-5 top-[calc(1rem+env(safe-area-inset-top))] size-11 rounded-full" />
        <div className="absolute inset-x-5 bottom-8 space-y-3">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-4/5 rounded-lg" />
        </div>
      </div>
      <div className="-mt-5 space-y-4 rounded-t-[2rem] bg-background px-5 py-7">
        <div className="flex justify-between gap-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
        </div>
        <DiscoveryResultCardSkeleton count={4} />
      </div>
    </main>
  );
}

export function DashboardPageSkeleton() {
  return (
    <main className="app-page gap-6" {...loadingProps}>
      <PageHeaderSkeleton />
      <Card className="app-card space-y-4 rounded-[1.75rem] p-5 shadow-none">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-3 w-48 max-w-full rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-2xl" />
          ))}
        </div>
      </Card>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <CompactCardListSkeleton count={3} />
      </div>
    </main>
  );
}

export function FormPageSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <main className="app-page gap-6" {...loadingProps}>
      <PageHeaderSkeleton />
      <div className="space-y-5">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-lg" />
            <Skeleton className="h-13 w-full rounded-2xl" />
          </div>
        ))}
        <Skeleton className="h-13 w-full rounded-2xl" />
      </div>
    </main>
  );
}

export function AuthScreenSkeleton() {
  return (
    <main className="flex min-h-dvh flex-col bg-background px-5 pb-8 pt-[calc(2rem+env(safe-area-inset-top))]" {...loadingProps}>
      <Skeleton className="size-11 rounded-full" />
      <div className="mx-auto mt-7 w-full max-w-md space-y-6">
        <Skeleton className="mx-auto aspect-[16/9] w-full rounded-[2rem]" />
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto h-7 w-48 rounded-xl" />
          <Skeleton className="mx-auto h-4 w-64 max-w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-13 w-full rounded-2xl" />
          <Skeleton className="h-13 w-full rounded-2xl" />
          <Skeleton className="h-13 w-full rounded-2xl" />
        </div>
      </div>
    </main>
  );
}

export function NotificationListSkeleton({ count = 4 }: CountProps) {
  return (
    <div className="space-y-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="space-y-3 rounded-3xl bg-surface p-4 shadow-none">
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <SkeletonLine />
          <SkeletonLine className="w-4/5" />
          <Skeleton className="h-3 w-28 rounded-lg" />
        </Card>
      ))}
    </div>
  );
}

export function ReviewListSkeleton({ count = 3 }: CountProps) {
  return (
    <div className="space-y-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="app-card rounded-3xl p-5 shadow-none">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2.5">
            <SkeletonLine />
            <SkeletonLine className="w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TicketListSkeleton({ count = 3 }: CountProps) {
  return (
    <div className="space-y-4" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="space-y-4 rounded-2xl p-4 shadow-none">
          <div className="flex justify-between gap-3">
            <Skeleton className="h-4 w-40 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </Card>
      ))}
    </div>
  );
}

export function LocationCardsSkeleton({ count = 2 }: CountProps) {
  return (
    <div className="flex flex-col gap-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="app-card min-h-28 rounded-[1.5rem] p-4 shadow-none">
          <div className="flex items-start gap-3">
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-4 w-1/2 rounded-lg" />
              <SkeletonLine />
              <SkeletonLine className="w-3/4" />
            </div>
            <Skeleton className="size-6 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function PickerRowsSkeleton({ count = 5 }: CountProps) {
  return (
    <div className="space-y-2 py-3" {...loadingProps}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4">
          <Skeleton className="h-4 w-2/5 rounded-lg" />
          <Skeleton className="size-6 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function SlotBookingSkeleton() {
  return (
    <main className="app-page gap-6" {...loadingProps}>
      <PageHeaderSkeleton />
      <Card className="app-card flex items-center gap-3 rounded-3xl p-4 shadow-none">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-3 w-48 max-w-full rounded-lg" />
        </div>
      </Card>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-16 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-auto h-14 w-full rounded-2xl" />
    </main>
  );
}

export function MapResultsSkeleton() {
  return (
    <div className="absolute inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))]" {...loadingProps}>
      <DiscoveryResultCardSkeleton count={1} />
    </div>
  );
}

export function RouteLoadingSkeleton() {
  return <ListPageSkeleton count={4} />;
}
