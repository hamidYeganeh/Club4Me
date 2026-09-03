import Image from "next/image";

import { accountAuthHomeHeroSectionStyles } from "./AccountAuthHomeHeroSection.styles";
import type { AccountAuthHomeHeroSectionProps } from "./AccountAuthHomeHeroSection.types";

export function AccountAuthHomeHeroSection({
  alt,
}: AccountAuthHomeHeroSectionProps) {
  const styles = accountAuthHomeHeroSectionStyles();

  return (
    <div className={styles.root()}>
      <Image
        src="/welcome/hero.jpg"
        alt={alt}
        fill
        priority
        sizes="100vw"
        className={styles.image()}
      />
    </div>
  );
}
