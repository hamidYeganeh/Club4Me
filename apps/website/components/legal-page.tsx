import Link from "next/link";

export function LegalPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:py-20">
      <Link href="/" className="text-sm font-semibold text-accent">
        جیم فور می ← صفحه اصلی
      </Link>
      <header className="mt-8 border-b border-border pb-8">
        <h1 className="text-3xl font-black sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-muted">{lead}</p>
        <p className="mt-3 text-xs text-muted">
          آخرین به‌روزرسانی: ۱۴ شهریور ۱۴۰۵
        </p>
      </header>
      <article className="space-y-8 py-8 text-sm leading-8 sm:text-base [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pe-5">
        {children}
      </article>
      <nav
        aria-label="پیوندهای حقوقی"
        className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-6 text-sm text-muted"
      >
        <Link className="hover:text-foreground" href="/privacy">
          حریم خصوصی
        </Link>
        <Link className="hover:text-foreground" href="/terms">
          قوانین استفاده
        </Link>
        <Link className="hover:text-foreground" href="/account-deletion">
          حذف حساب
        </Link>
        <Link className="hover:text-foreground" href="/support">
          پشتیبانی
        </Link>
      </nav>
    </main>
  );
}
