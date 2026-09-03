import { accountAuthForgotPasswordSupportSectionStyles } from "./AccountAuthForgotPasswordSupportSection.styles";
import type { AccountAuthForgotPasswordSupportSectionProps } from "./AccountAuthForgotPasswordSupportSection.types";

export function AccountAuthForgotPasswordSupportSection({
  hint,
  contactPrefix,
  supportEmail,
}: AccountAuthForgotPasswordSupportSectionProps) {
  const styles = accountAuthForgotPasswordSupportSectionStyles();

  return (
    <p className={styles.root()}>
      <span>{hint}</span>
      <span>
        {contactPrefix}{" "}
        <a href={`mailto:${supportEmail}`} className={styles.email()}>
          {supportEmail}
        </a>
      </span>
    </p>
  );
}
