export type WelcomeIntroduceSlide = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
};

export type WelcomeIntroduceCarouselSectionProps = {
  slides: WelcomeIntroduceSlide[];
  prevLabel: string;
  nextLabel: string;
  paginationLabel: string;
  slideLabels: string[];
};
