import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { applicationLink } from "@/modules/marketing/lib/application-link";
import {
  catalogs,
  dateLabel,
  detailPath,
  entry,
  getCatalog,
  isCatalogKind,
  listCatalog,
} from "@/modules/discovery/catalog";
import {
  Breadcrumbs,
  CatalogCards,
  Facts,
  Faq,
  StructuredData,
} from "@/modules/discovery/components";
import { safeArticleHtml } from "@/modules/discovery/article-html";
import styles from "@/modules/discovery/discovery.module.css";
type Props = { params: Promise<{ kind: string; slug: string }> };
async function load(params: Props["params"]) {
  const { kind, slug } = await params;
  if (!isCatalogKind(kind)) notFound();
  const item = await getCatalog(kind, slug);
  if (!item) notFound();
  return { kind, item, normalized: entry(kind, item) };
}
export async function generateMetadata({ params }: Props) {
  const { kind, item, normalized: n } = await load(params);
  const description =
    n.description.slice(0, 170) ||
    `${n.title}؛ اطلاعات و جزئیات ${catalogs[kind].singular} در Gym4Me.`;
  const meta = pageMetadata(
    n.title,
    description,
    detailPath(kind, n.slug),
    n.image,
  );
  return {
    ...meta,
    ...("bodyHtml" in item
      ? {
          openGraph: {
            ...meta.openGraph,
            type: "article" as const,
            ...(item.publishedAt ? { publishedTime: item.publishedAt } : {}),
            ...(item.authorName ? { authors: [item.authorName] } : {}),
          },
        }
      : {}),
  };
}
export default async function DetailPage({ params }: Props) {
  const { kind, item, normalized: n } = await load(params);
  const { slug } = await params;
  const path = detailPath(kind, n.slug);
  if (slug !== n.slug) permanentRedirect(path);
  const crumbs = [
    { title: catalogs[kind].title, href: `/discovery/${kind}` },
    { title: n.title, href: path },
  ];
  const baseSchema = {
    "@context": "https://schema.org",
    name: n.title,
    url: absoluteUrl(path),
    description: n.description,
    ...(n.image ? { image: n.image } : {}),
  };
  if ("bodyHtml" in item)
    return (
      <article className={styles.article}>
        <Breadcrumbs items={crumbs} />
        <header>
          <p className={styles.kicker}>مجله Gym4Me</p>
          <h1 className={styles.title}>{n.title}</h1>
          <p className={styles.description}>{item.excerpt}</p>
          <Facts
            items={[
              ["نویسنده", item.authorName],
              ["تاریخ انتشار", dateLabel(item.publishedAt)],
              [
                "زمان مطالعه",
                item.readTimeMinutes
                  ? `${item.readTimeMinutes.toLocaleString("fa-IR")} دقیقه`
                  : null,
              ],
            ]}
          />
        </header>
        {n.image && (
          <div className={`${styles.heroImage} my-8`}>
            <CoverImage src={n.image} alt={n.title} priority />
          </div>
        )}
        <div
          className={styles.articleBody}
          dangerouslySetInnerHTML={{ __html: safeArticleHtml(item.bodyHtml) }}
        />
        <Link
          className="mt-10 inline-block underline"
          href="/discovery/articles"
        >
          بیشتر بخوان؛ همه مقالات
        </Link>
        <StructuredData
          value={{
            ...baseSchema,
            "@type": "Article",
            headline: n.title,
            inLanguage: "fa-IR",
            mainEntityOfPage: absoluteUrl(path),
            ...(item.authorName
              ? { author: { "@type": "Person", name: item.authorName } }
              : {}),
            ...(item.publishedAt ? { datePublished: item.publishedAt } : {}),
            publisher: {
              "@type": "Organization",
              name: "Gym4Me",
              url: absoluteUrl("/"),
            },
          }}
        />
      </article>
    );
  const appPath = applicationLink(path);
  let related: Awaited<ReturnType<typeof listCatalog<"classes">>> | null = null;
  if ("name" in item) {
    try {
      related = await listCatalog("classes", 1, "", 3, item.id);
    } catch {
      /* Main club content remains available if related classes fail. */
    }
  }
  const schema =
    "name" in item
      ? {
          ...baseSchema,
          "@type": "SportsActivityLocation",
          ...(item.address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: item.address,
                  addressCountry: "IR",
                },
              }
            : {}),
          ...(item.location
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  longitude: item.location.coordinates[0],
                  latitude: item.location.coordinates[1],
                },
              }
            : {}),
          ...(item.reviewsCount > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: item.averageRating,
                  reviewCount: item.reviewsCount,
                  bestRating: 5,
                },
              }
            : {}),
        }
      : "displayName" in item
        ? { ...baseSchema, "@type": "Person", jobTitle: "مربی ورزشی" }
        : {
            ...baseSchema,
            "@type": "Course",
            provider: {
              "@type": "Organization",
              name: "Gym4Me",
              url: absoluteUrl("/"),
            },
          };
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>{catalogs[kind].singular} در Gym4Me</p>
          <h1 className={styles.title}>{n.title}</h1>
          <p className={styles.description}>{n.description}</p>
        </div>
        <div className={styles.heroImage}>
          <CoverImage src={n.image} alt={n.title} priority />
        </div>
      </header>
      <div className={styles.details}>
        <div>
          {"name" in item && (
            <>
              <section className={styles.panel}>
                <h2>درباره باشگاه</h2>
                <p className={styles.description}>{item.shortDescription}</p>
                <Facts
                  items={[
                    ["نشانی", item.address],
                    [
                      "امتیاز کاربران",
                      item.reviewsCount > 0
                        ? `${item.averageRating.toLocaleString("fa-IR")} از ۵ · ${item.reviewsCount.toLocaleString("fa-IR")} نظر`
                        : null,
                    ],
                  ]}
                />
                {item.location && (
                  <a
                    className="my-4 inline-block underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${item.location.coordinates[1]},${item.location.coordinates[0]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    دیدن موقعیت روی نقشه
                  </a>
                )}
                {item.tags?.length > 0 && (
                  <ul className={styles.list}>
                    {item.tags.map((tag) => (
                      <li key={tag}>{tag}</li>
                    ))}
                  </ul>
                )}
              </section>
              {item.weeklyHours?.length > 0 && (
                <section className={styles.panel}>
                  <h2>ساعت فعالیت</h2>
                  <Facts
                    items={item.weeklyHours.map((day) => [
                      [
                        "یکشنبه",
                        "دوشنبه",
                        "سه‌شنبه",
                        "چهارشنبه",
                        "پنجشنبه",
                        "جمعه",
                        "شنبه",
                      ][day.dayOfWeek] ?? "روز",
                      day.isClosed
                        ? "تعطیل"
                        : day.periods
                            .map(
                              (period) =>
                                `${period.opensAt} تا ${period.closesAt}`,
                            )
                            .join("، "),
                    ])}
                  />
                </section>
              )}
              {related && (
                <section className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>کلاس‌های این باشگاه</h2>
                  </div>
                  {related.items.length ? (
                    <CatalogCards
                      kind="classes"
                      items={related.items.map((x) => entry("classes", x))}
                    />
                  ) : (
                    <p className={styles.empty}>
                      هنوز کلاس عمومی برای این باشگاه منتشر نشده است.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
          {"displayName" in item && (
            <>
              <section className={styles.panel}>
                <h2>درباره مربی</h2>
                <p className={styles.description}>
                  {item.bio || item.shortBio}
                </p>
                <Facts
                  items={[
                    [
                      "سابقه مربیگری",
                      item.experienceYears
                        ? `${item.experienceYears.toLocaleString("fa-IR")} سال`
                        : null,
                    ],
                    [
                      "امتیاز کاربران",
                      item.reviewsCount > 0
                        ? `${item.averageRating.toLocaleString("fa-IR")} از ۵ · ${item.reviewsCount.toLocaleString("fa-IR")} نظر`
                        : null,
                    ],
                    ["زبان‌ها", item.languages?.join("، ")],
                    [
                      "محدوده خدمات",
                      item.serviceArea?.map((area) => area.name).join("، "),
                    ],
                    ["حداقل سن", item.minAcceptedAge],
                    ["حداکثر سن", item.maxAcceptedAge],
                  ]}
                />
              </section>
              {item.specialties?.length > 0 && (
                <section className={styles.panel}>
                  <h2>تخصص‌ها</h2>
                  {item.specialties.map((x, i) => (
                    <div key={i}>
                      <h3 className="mt-5 font-bold">{x.title}</h3>
                      <p className={styles.description}>{x.description}</p>
                    </div>
                  ))}
                </section>
              )}
              {item.experience?.length > 0 && (
                <section className={styles.panel}>
                  <h2>تجربه و سوابق</h2>
                  {item.experience.map((x, i) => (
                    <div key={i}>
                      <h3 className="mt-5 font-bold">{x.title}</h3>
                      <p className={styles.description}>
                        {[x.organization, x.period, x.description]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </section>
              )}
              {item.trainingStyles?.length > 0 && (
                <section className={styles.panel}>
                  <h2>شیوه‌های تمرین</h2>
                  {item.trainingStyles.map((style, index) => (
                    <div key={index}>
                      <h3 className="mt-5 font-bold">{style.title}</h3>
                      <p className={styles.description}>{style.description}</p>
                    </div>
                  ))}
                </section>
              )}
              {item.portfolio?.length > 0 && (
                <section className={styles.panel}>
                  <h2>گالری مربی</h2>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {item.portfolio.map((photo, index) => (
                      <div className={styles.heroImage} key={photo.id}>
                        <CoverImage
                          src={photo.url}
                          alt={`تصویر ${index + 1} از گالری ${item.displayName}`}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <Faq items={item.faqs} />
            </>
          )}
          {"courseStartAt" in item && (
            <>
              <section className={styles.panel}>
                <h2>اطلاعات دوره</h2>
                <Facts
                  items={[
                    [
                      "شیوه برگزاری",
                      item.deliveryMode === "online"
                        ? "آنلاین"
                        : item.deliveryMode === "hybrid"
                          ? "حضوری و آنلاین"
                          : "حضوری",
                    ],
                    ["شروع دوره", dateLabel(item.courseStartAt)],
                    ["پایان دوره", dateLabel(item.courseEndAt)],
                    ["شروع ثبت‌نام", dateLabel(item.registrationStartAt)],
                    ["پایان ثبت‌نام", dateLabel(item.registrationEndAt)],
                    ["ظرفیت کل", item.capacity],
                    [
                      "ظرفیت باقی‌مانده",
                      Math.max(0, item.capacity - item.enrollmentCount),
                    ],
                    ["نشانی", item.venue?.address],
                  ]}
                />
                {item.clubId && (
                  <Link
                    className="underline"
                    href={detailPath("clubs", item.clubId)}
                  >
                    دیدن باشگاه برگزارکننده
                  </Link>
                )}
              </section>
              {item.coachIds?.length > 0 && (
                <section className={styles.panel}>
                  <h2>مربی‌های این دوره</h2>
                  <ul className={styles.list}>
                    {item.coachIds.map((id, index) => (
                      <li key={id}>
                        <Link href={detailPath("coaches", id)}>
                          مشاهده پروفایل مربی{" "}
                          {(index + 1).toLocaleString("fa-IR")}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {item.prerequisites?.length > 0 && (
                <section className={styles.panel}>
                  <h2>پیش‌نیازهای شرکت</h2>
                  <ul className={styles.list}>
                    {item.prerequisites.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </section>
              )}
              <Faq items={item.faqs} />
            </>
          )}
        </div>
        <aside className={`${styles.panel} ${styles.aside}`}>
          <h2>
            {kind === "clubs"
              ? "برای جلسه بعدی آماده‌ای؟"
              : kind === "coaches"
                ? "با این مربی تمرین کن"
                : "شرکت در این کلاس"}
          </h2>
          {"price" in item && (
            <Facts
              items={[
                [
                  "هزینه دوره",
                  `${item.price.amount.toLocaleString("fa-IR")} ${item.price.currency === "IRT" ? "تومان" : item.price.currency === "IRR" ? "ریال" : item.price.currency}`,
                ],
              ]}
            />
          )}
          <p className={styles.description}>
            زمان‌های قابل رزرو و شرایط نهایی را در اپ بررسی کن. ثبت‌نام و پرداخت
            از حساب خودت انجام می‌شود.
          </p>
          <a className={`${styles.button} mt-6 w-full`} href={appPath}>
            {kind === "classes"
              ? "بررسی ثبت‌نام در اپ"
              : kind === "coaches"
                ? "دیدن خدمات مربی در اپ"
                : "دیدن سانس‌ها در اپ"}
          </a>
          <Link
            className="mt-5 block text-center text-sm underline"
            href={`/discovery/${kind}`}
          >
            دیدن دیگر {catalogs[kind].title}
          </Link>
        </aside>
      </div>
      <StructuredData value={schema} />
    </>
  );
}
