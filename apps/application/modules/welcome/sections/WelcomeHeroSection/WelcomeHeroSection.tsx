import Image from "next/image";

import { welcomeHeroSectionStyles } from "./WelcomeHeroSection.styles";
import type { WelcomeHeroSectionProps } from "./WelcomeHeroSection.types";

export function WelcomeHeroSection({ alt }: WelcomeHeroSectionProps) {
  const styles = welcomeHeroSectionStyles();

  return (
    <section className={styles.root()}>
      <Image
        src="/welcome/hero.jpg"
        alt={alt}
        fill
        priority
        sizes="100vw"
        className={styles.image()}
      />
      <div aria-hidden className={styles.fade()} />
    </section>
  );
}
