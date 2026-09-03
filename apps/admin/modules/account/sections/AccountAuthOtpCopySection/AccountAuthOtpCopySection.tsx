import { Typography } from "@heroui/react";

import { accountAuthOtpCopySectionStyles } from "./AccountAuthOtpCopySection.styles";
import type { AccountAuthOtpCopySectionProps } from "./AccountAuthOtpCopySection.types";

export function AccountAuthOtpCopySection({
  title,
  subtitle,
  titleId = "account-auth-otp-title",
}: AccountAuthOtpCopySectionProps) {
  const styles = accountAuthOtpCopySectionStyles();

  return (
    <section className={styles.root()}>
      <Typography type="h2" id={titleId} className={styles.title()}>
        {title}
      </Typography>
      {subtitle ? <Typography type="body-sm" color="muted" className={styles.subtitle()}>{subtitle}</Typography> : null}
    </section>
  );
}
