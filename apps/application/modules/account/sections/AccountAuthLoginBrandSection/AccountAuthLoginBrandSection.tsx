"use client";

import Image from "next/image";
import { Typography } from "@heroui/react";
import { LineShadowText } from "@repo/ui/line-shadow-text";

import { accountAuthLoginBrandSectionStyles } from "./AccountAuthLoginBrandSection.styles";
import type { AccountAuthLoginBrandSectionProps } from "./AccountAuthLoginBrandSection.types";

export function AccountAuthLoginBrandSection({
  name,
  tagline,
  illustrationAlt = "",
  showIllustration = true,
  compact = false,
}: AccountAuthLoginBrandSectionProps) {
  const styles = accountAuthLoginBrandSectionStyles({
    compact,
    showIllustration,
  });

  return (
    <section className={styles.root()}>
      {showIllustration ? (
        <Image
          src="/auth/club-access-iran-v2.png"
          alt={illustrationAlt}
          width={1086}
          height={1448}
          priority
          className={styles.image()}
        />
      ) : null}
      <Typography
        type="h2"
        id="account-auth-login-title"
        className={styles.title()}
      >
        <LineShadowText
          shadowColor="var(--accent)"
          dir="ltr"
          className="font-brand text-5xl font-normal tracking-normal sm:text-6xl"
        >
          {name}
        </LineShadowText>
      </Typography>
      <Typography type="body-sm" color="muted" className={styles.tagline()}>
        {tagline}
      </Typography>
    </section>
  );
}
