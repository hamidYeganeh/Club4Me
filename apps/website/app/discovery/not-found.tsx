import Link from "next/link";
export default function NotFound() {
  return (
    <section className="py-16">
      <h1 className="text-3xl font-bold">این صفحه پیدا نشد</h1>
      <p className="my-5 text-muted">
        ممکن است این مورد حذف شده یا هنوز منتشر نشده باشد.
      </p>
      <Link href="/discovery" className="underline">
        دیدن باشگاه‌ها، کلاس‌ها و مربی‌ها
      </Link>
    </section>
  );
}
