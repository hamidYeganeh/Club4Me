"use client";

import { CoverImage } from "@/components/cover-image";

type CatalogItem = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  href: string;
};

export function LandingCatalogSection({
  id,
  title,
  items,
  isPending,
  isError,
  onRetry,
  className,
}: {
  id: string;
  title: string;
  items: CatalogItem[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  className?: string;
}) {
  const appUrl =
    process.env.NEXT_PUBLIC_APPLICATION_URL ?? "https://app.gym4me.ir";
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl px-6 py-16 ${className ?? ""}`}
    >
      <h2 className="mb-8 text-3xl font-semibold">{title}</h2>
      {isPending ? <p role="status">در حال بارگذاری…</p> : null}
      {isError ? (
        <div role="alert">
          <p>دریافت اطلاعات ممکن نشد.</p>
          <button
            type="button"
            className="mt-3 text-accent underline"
            onClick={onRetry}
          >
            تلاش دوباره
          </button>
        </div>
      ) : null}
      {!isPending && !isError && items.length === 0 ? (
        <p className="text-muted">در حال حاضر موردی برای نمایش وجود ندارد.</p>
      ) : null}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <a
            key={item.id}
            href={`${appUrl.replace(/\/$/, "")}${item.href}`}
            className="overflow-hidden rounded-2xl border border-border bg-surface focus-visible:outline-2 focus-visible:outline-accent"
          >
            {item.imageUrl ? (
              <CoverImage
                src={item.imageUrl}
                alt={item.title}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : null}
            <div className="p-5">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">
                {item.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
