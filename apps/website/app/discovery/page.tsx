import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  catalogs,
  entry,
  listCatalog,
  searchText,
  type CatalogKind,
} from "@/modules/discovery/catalog";
import {
  Breadcrumbs,
  CatalogCards,
  SearchForm,
} from "@/modules/discovery/components";
import styles from "@/modules/discovery/discovery.module.css";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = searchText((await searchParams).q);
  return {
    ...pageMetadata(
      "کشف باشگاه، مربی، کلاس و مقاله",
      "باشگاه‌ها، مربی‌ها و کلاس‌های ورزشی را پیدا کن و مقاله‌های منتشرشده را بخوان.",
      "/discovery",
    ),
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const q = searchText((await searchParams).q);
  const kinds = Object.keys(catalogs) as CatalogKind[];
  const results = await Promise.allSettled(
    kinds.map((kind) => listCatalog(kind, 1, q, 3)),
  );
  return (
    <>
      <Breadcrumbs items={[]} />
      <header className={styles.intro}>
        <p className={styles.kicker}>کشف Gym4Me</p>
        <h1 className={styles.title}>جای تمرین و مربی خودت را پیدا کن</h1>
        <p className={styles.description}>
          جزئیات را همین‌جا ببین؛ برای رزرو، ثبت‌نام و دنبال‌کردن تمرین‌ها وارد
          اپ شو.
        </p>
      </header>
      <SearchForm action="/discovery" q={q} />
      {kinds.map((kind, i) => {
        const result = results[i]!;
        return (
          <section className={styles.section} key={kind}>
            <div className={styles.sectionHeader}>
              <h2>{catalogs[kind].title}</h2>
              <Link
                href={`/discovery/${kind}${q ? `?q=${encodeURIComponent(q)}` : ""}`}
              >
                مشاهده همه
              </Link>
            </div>
            {result.status === "rejected" ? (
              <p className={styles.empty}>
                دریافت این بخش ممکن نشد. از صفحه فهرست دوباره تلاش کن.
              </p>
            ) : result.value.items.length ? (
              <CatalogCards
                kind={kind}
                items={result.value.items.map((item) => entry(kind, item))}
              />
            ) : (
              <p className={styles.empty}>
                {q
                  ? "نتیجه‌ای برای این جست‌وجو پیدا نشد."
                  : "هنوز موردی منتشر نشده است."}
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
