"use client";

import Image from "next/image";
import { Typography } from "@heroui/react";

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
          src="/auth/login-illustration.png"
          alt={illustrationAlt}
          width={288}
          height={464}
          priority
          className={styles.image()}
        />
      ) : null}
      <Typography
        type="h2"
        id="account-auth-login-title"
        className={styles.title()}
      >
        {name}
      </Typography>
      <Typography type="body-sm" color="muted" className={styles.tagline()}>
        {tagline}
      </Typography>
    </section>
  );
}
