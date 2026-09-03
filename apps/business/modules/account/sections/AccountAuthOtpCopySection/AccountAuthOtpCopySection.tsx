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
      <h1 id={titleId} className={styles.title()}>
        {title}
      </h1>
      {subtitle ? <p className={styles.subtitle()}>{subtitle}</p> : null}
    </section>
  );
}
