"use client";

import { Typography } from "@heroui/react";

import { accountAuthForgotPasswordSupportSectionStyles } from "./AccountAuthForgotPasswordSupportSection.styles";
import type { AccountAuthForgotPasswordSupportSectionProps } from "./AccountAuthForgotPasswordSupportSection.types";

export function AccountAuthForgotPasswordSupportSection({
  hint,
  contactPrefix,
  supportEmail,
}: AccountAuthForgotPasswordSupportSectionProps) {
  const styles = accountAuthForgotPasswordSupportSectionStyles();

  return (
    <Typography type="body-sm" color="muted" className={styles.root()}>
      <span>{hint}</span>
      <span>
        {contactPrefix}{" "}
        <a href={`mailto:${supportEmail}`} className={styles.email()}>
          {supportEmail}
        </a>
      </span>
    </Typography>
  );
}
