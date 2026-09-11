import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { absoluteUrl, jsonLd } from "@/lib/seo";
import { catalogs, detailPath, type CatalogKind, type Entry } from "./catalog";
import styles from "./discovery.module.css";
export function StructuredData({ value }: { value: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(value) }}
    />
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { title: string; href: string }[];
}) {
  const all = [
    { title: "خانه", href: "/" },
    { title: "کشف", href: "/discovery" },
    ...items,
  ];
  return (
    <>
      <nav className={styles.breadcrumbs} aria-label="مسیر صفحه">
        {all.map((item, i) => (
          <span key={item.href}>
            {i > 0 && <span aria-hidden> / </span>}
            {i === all.length - 1 ? (
              <span aria-current="page">{item.title}</span>
            ) : (
              <Link href={item.href}>{item.title}</Link>
            )}
          </span>
        ))}
      </nav>
      <StructuredData
        value={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.title,
            item: absoluteUrl(item.href),
          })),
        }}
      />
    </>
  );
}
export function CatalogCards({
  kind,
  items,
}: {
  kind: CatalogKind;
  items: Entry[];
}) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Link
          className={styles.card}
          href={detailPath(kind, item.slug)}
          key={item.id}
        >
          <div className={styles.cover}>
            <CoverImage src={item.image} alt={item.title} />
          </div>
          <div className={styles.cardBody}>
            {item.label && <small>{item.label}</small>}
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span className={styles.cardAction}>
              {kind === "articles"
                ? "خواندن مقاله"
                : `جزئیات ${catalogs[kind].singular}`}{" "}
              ←
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
export function SearchForm({ action, q = "" }: { action: string; q?: string }) {
  return (
    <form action={action} method="get" className={styles.search}>
      <label className="sr-only" htmlFor="catalog-search">
        جست‌وجو
      </label>
      <input
        id="catalog-search"
        name="q"
        defaultValue={q}
        placeholder="نام، رشته یا موضوع مورد نظر…"
        maxLength={120}
        type="search"
      />
      <button type="submit">جست‌وجو</button>
      {q && (
        <Link className={styles.button} href={action}>
          پاک کردن جست‌وجو
        </Link>
      )}
    </form>
  );
}
export function Faq({
  items,
}: {
  items?: { question: string; answer: string }[];
}) {
  if (!items?.length) return null;
  return (
    <section className={styles.panel}>
      <h2>سؤال‌های متداول</h2>
      {items.map((item, i) => (
        <details className={styles.faq} key={i}>
          <summary>{item.question}</summary>
          <p className={styles.description}>{item.answer}</p>
        </details>
      ))}
    </section>
  );
}
export function Facts({
  items,
}: {
  items: [string, string | number | null | undefined][];
}) {
  return (
    <dl className={styles.facts}>
      {items
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([title, value]) => (
          <div key={title}>
            <dt>{title}</dt>
            <dd>
              {typeof value === "number"
                ? value.toLocaleString("fa-IR")
                : value}
            </dd>
          </div>
        ))}
    </dl>
  );
}
