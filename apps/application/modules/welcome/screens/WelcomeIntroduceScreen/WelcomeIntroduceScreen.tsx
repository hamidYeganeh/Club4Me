import { WelcomeIntroduceCarouselSection } from "@modules/welcome/sections/WelcomeIntroduceCarouselSection";
import { getTranslations } from "next-intl/server";

const SLIDE_KEYS = ["discover", "score", "book", "progress"] as const;

const SLIDE_IMAGES = {
  discover: "/welcome/introduce/discover-iran-v2.png",
  score: "/welcome/introduce/score-iran-v2.png",
  book: "/welcome/introduce/book-iran-v2.png",
  progress: "/welcome/introduce/progress-iran-v2.png",
} as const;

export async function WelcomeIntroduceScreen() {
  const t = await getTranslations("welcome.introduce");
  const slides = SLIDE_KEYS.map((key) => ({
    title: t(`slides.${key}.title`),
    subtitle: t(`slides.${key}.subtitle`),
    imageSrc: SLIDE_IMAGES[key],
    imageAlt: t(`slides.${key}.imageAlt`),
  }));

  return (
    <main className="h-dvh overflow-hidden bg-background">
      <WelcomeIntroduceCarouselSection
        slides={slides}
        prevLabel={t("prevSlide")}
        nextLabel={t("nextSlide")}
        paginationLabel={t("pagination")}
        slideLabels={slides.map((_, index) =>
          t("slideOf", { current: index + 1, total: slides.length }),
        )}
      />
    </main>
  );
}
