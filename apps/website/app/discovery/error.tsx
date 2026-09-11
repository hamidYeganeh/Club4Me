"use client";
import Link from "next/link";
export default function CatalogError({ reset }: { reset: () => void }) {
  return (
    <section
      className="rounded-3xl border border-border bg-surface p-8"
      role="alert"
    >
      <h1 className="text-2xl font-bold">دریافت اطلاعات ممکن نشد</h1>
      <p className="my-4 leading-8 text-muted">
        ارتباط با فهرست موقتاً برقرار نیست. دوباره تلاش کن.
      </p>
      <button
        type="button"
        className="rounded-xl bg-accent px-5 py-3 text-accent-foreground"
        onClick={reset}
      >
        تلاش دوباره
      </button>
      <Link href="/discovery" className="mx-5 underline">
        بازگشت به کشف
      </Link>
    </section>
  );
}
