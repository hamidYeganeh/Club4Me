import { WelcomeIntroduceCarouselSection } from "@modules/welcome/sections/WelcomeIntroduceCarouselSection";
import { getTranslations } from "next-intl/server";

const SLIDE_KEYS = ["discover", "score", "book", "progress"] as const;

const SLIDE_IMAGES = {
  discover: "/welcome/introduce/discover.jpg",
  score: "/welcome/introduce/score.jpg",
  book: "/welcome/introduce/book.jpg",
  progress: "/welcome/introduce/progress.jpg",
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
