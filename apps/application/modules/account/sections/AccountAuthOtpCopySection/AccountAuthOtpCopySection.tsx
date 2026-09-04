"use client";

import { Typography } from "@heroui/react";

import { accountAuthOtpCopySectionStyles } from "./AccountAuthOtpCopySection.styles";
import type { AccountAuthOtpCopySectionProps } from "./AccountAuthOtpCopySection.types";

export function AccountAuthOtpCopySection({
  title,
  subtitle,
  titleId = "account-auth-otp-title",
  cue = true,
}: AccountAuthOtpCopySectionProps) {
  const styles = accountAuthOtpCopySectionStyles({ cue: Boolean(subtitle) && cue });

  return (
    <section className={styles.root()}>
      {title ? (
        <Typography type="h2" id={titleId} className={styles.title()}>
          {title}
        </Typography>
      ) : null}
      {subtitle ? (
        <p className={styles.subtitle()}>{subtitle}</p>
      ) : null}
    </section>
  );
}
