import Image from "next/image";

import { accountAuthOtpHeroSectionStyles } from "./AccountAuthOtpHeroSection.styles";
import type { AccountAuthOtpHeroSectionProps } from "./AccountAuthOtpHeroSection.types";

export function AccountAuthOtpHeroSection({
  alt,
  size = "default",
  src = "/auth/login-illustration.png",
  width = 288,
  height = 464,
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
