"use client";

import { Typography } from "@heroui/react";

import { accountAuthRolesCopySectionStyles } from "./AccountAuthRolesCopySection.styles";
import type { AccountAuthRolesCopySectionProps } from "./AccountAuthRolesCopySection.types";

export function AccountAuthRolesCopySection({
  title,
  subtitle,
  titleId = "account-auth-roles-title",
}: AccountAuthRolesCopySectionProps) {
  const styles = accountAuthRolesCopySectionStyles();

  return (
    <section className={styles.root()}>
      <Typography type="h2" id={titleId} className={styles.title()}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography type="body-sm" color="muted" className={styles.subtitle()}>
          {subtitle}
        </Typography>
      ) : null}
    </section>
  );
}
