import { DiscoveryHeroScrim } from "@modules/discovery/components/DiscoveryImageHero";
import Image from "next/image";

import { welcomeHeroSectionStyles } from "./WelcomeHeroSection.styles";
import type { WelcomeHeroSectionProps } from "./WelcomeHeroSection.types";

export function WelcomeHeroSection({ alt }: WelcomeHeroSectionProps) {
  const styles = welcomeHeroSectionStyles();

  return (
    <section className={styles.root()}>
      <Image
        src="/welcome/hero-iran-v2.png"
        alt={alt}
        fill
        priority
        sizes="100vw"
        className={styles.image()}
      />
      <DiscoveryHeroScrim />
    </section>
  );
}
