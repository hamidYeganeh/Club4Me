import Link from "next/link";
import { notFound } from "next/navigation";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import {
  catalogs,
  entry,
  detailPath,
  isCatalogKind,
  listCatalog,
  pageNumber,
  searchText,
} from "@/modules/discovery/catalog";
import {
  Breadcrumbs,
  CatalogCards,
  SearchForm,
  StructuredData,
} from "@/modules/discovery/components";
import styles from "@/modules/discovery/discovery.module.css";
type Props = {
  params: Promise<{ kind: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { kind } = await params;
  if (!isCatalogKind(kind)) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = searchText(query.q);
  return {
    ...pageMetadata(
      `${catalogs[kind].title}${page > 1 ? ` — صفحه ${page.toLocaleString("fa-IR")}` : ""}`,
      catalogs[kind].description,
      `/discovery/${kind}${page > 1 ? `?page=${page}` : ""}`,
    ),
    ...(q ? { robots: { index: false, follow: true } } : {}),
  };
}
export default async function CatalogPage({ params, searchParams }: Props) {
  const { kind } = await params;
  if (!isCatalogKind(kind)) notFound();
  const query = await searchParams;
  const page = pageNumber(query.page);
  const q = searchText(query.q);
  const data = await listCatalog(kind, page, q);
  if (page > 1 && page > data.totalPages) notFound();
  const items = data.items.map((item) => entry(kind, item));
  const href = (n: number) =>
    `/discovery/${kind}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`;
  return (
    <>
      <Breadcrumbs
        items={[{ title: catalogs[kind].title, href: `/discovery/${kind}` }]}
      />
      <header className={styles.intro}>
        <h1 className={styles.title}>{catalogs[kind].title}</h1>
        <p className={styles.description}>{catalogs[kind].description}</p>
      </header>
      <SearchForm action={`/discovery/${kind}`} q={q} />
      <p className="mb-6 text-sm text-muted">
        {data.total.toLocaleString("fa-IR")} نتیجه{q ? ` برای «${q}»` : ""}
      </p>
      {items.length ? (
        <CatalogCards kind={kind} items={items} />
      ) : (
        <p className={styles.empty}>
          {q
            ? "نتیجه‌ای پیدا نشد. عبارت کوتاه‌تری را امتحان کن."
            : "هنوز موردی در این فهرست منتشر نشده است."}
        </p>
      )}
      {data.totalPages > 1 && (
        <nav className={styles.pagination} aria-label="صفحه‌بندی">
          {page > 1 && (
            <Link href={href(page - 1)} rel="prev">
              صفحه قبل
            </Link>
          )}
          <span>
            صفحه {page.toLocaleString("fa-IR")} از{" "}
            {data.totalPages.toLocaleString("fa-IR")}
          </span>
          {page < data.totalPages && (
            <Link href={href(page + 1)} rel="next">
              صفحه بعد
            </Link>
          )}
        </nav>
      )}
      <StructuredData
        value={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: (page - 1) * data.limit + i + 1,
            name: item.title,
            url: absoluteUrl(detailPath(kind, item.slug)),
          })),
        }}
      />
    </>
  );
}
