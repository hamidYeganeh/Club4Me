"use client";

import { TextWithBrand } from "@modules/marketing/components/kit/LineShadowText";
import { Typography } from "@heroui/react/typography";
import { ArrowUpRight } from "@modules/marketing/icons/icons/ArrowUpRight";
import { ArticleCard } from "@modules/marketing/components/cards/ArticleCard";
import { motion, useReducedMotion } from "@ui/landing-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCatalogArticles } from "@api/discovery";
import { CatalogStatus } from "../../components/CatalogStatus";
import { landingReveal } from "../../lib/landing-motion";
import { landingBlogsSectionStyles } from "./LandingBlogsSection.styles";
import type { LandingBlogsSectionProps } from "./LandingBlogsSection.types";

function Reveal({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      transition={landingReveal(delay)}
      viewport={{ once: true, margin: "-50px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function LandingBlogsSection({ className }: LandingBlogsSectionProps) {
  const slots = landingBlogsSectionStyles();
  const router = useRouter();
  const query = useCatalogArticles({ limit: 4 });

  return (
    <section
      className={slots.root({ className })}
      dir="rtl"
      id="articles"
      lang="fa"
    >
      <div className={slots.inner()}>
        <header className={slots.header()}>
          <Reveal delay={0.1}>
            <Typography className={slots.heading()} type="h2" weight="medium">
              راهنماهایی که در اپ هم می‌خوانی
            </Typography>
          </Reveal>
          <Reveal delay={0.2}>
            <Typography className={slots.sub()} type="body">
              <TextWithBrand>
                گرم‌کردن، تغذیه و ریکاوری. همان کارت مقاله کشف Gym4Me، برای
                تمرین هوشمندانه‌تر.
              </TextWithBrand>
            </Typography>
          </Reveal>
          <Reveal delay={0.3}>
            <Link className={slots.cta()} href="/discovery/articles">
              مشاهده همه مقالات
              <ArrowUpRight aria-hidden size={16} />
            </Link>
          </Reveal>
        </header>

        <CatalogStatus
          pending={query.isPending}
          error={query.isError}
          empty={!query.data?.items.length}
          retry={() => {
            void query.refetch();
          }}
        />
        <div className={slots.rail()}>
          {(query.data?.items ?? []).map((article, index) => (
            <Reveal delay={0.2 + index * 0.08} key={article.id}>
              <ArticleCard
                actionLabel="ادامه مطلب"
                author={{ name: article.authorName }}
                category="مقاله ورزشی"
                className={slots.card()}
                coverSrc={article.coverImageUrl ?? undefined}
                excerpt={article.excerpt}

                orientation="vertical"
                publishedAtLabel={
                  article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString(
                        "fa-IR",
                        { timeZone: "Asia/Tehran" },
                      )
                    : undefined
                }
                readingTimeLabel={
                  article.readTimeMinutes
                    ? `${article.readTimeMinutes} دقیقه مطالعه`
                    : undefined
                }

                title={
                  <Link
                    href={`/discovery/articles/${encodeURIComponent(article.slug)}`}
                  >
                    {article.title}
                  </Link>
                }
                type="cover"

                onPress={() =>
                  router.push(
                    `/discovery/articles/${encodeURIComponent(article.slug)}`,
                  )
                }
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
