import Image from "next/image";

import { accountAuthOtpHeroSectionStyles } from "./AccountAuthOtpHeroSection.styles";
import type { AccountAuthOtpHeroSectionProps } from "./AccountAuthOtpHeroSection.types";

export function AccountAuthOtpHeroSection({
  alt,
  size = "default",
  src = "/auth/club-access-iran-v2.png",
  width = 1086,
  height = 1448,
}: AccountAuthOtpHeroSectionProps) {
  const styles = accountAuthOtpHeroSectionStyles({ size });

  return (
    <section className={styles.root()}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        className={styles.image()}
      />
    </section>
  );
}
