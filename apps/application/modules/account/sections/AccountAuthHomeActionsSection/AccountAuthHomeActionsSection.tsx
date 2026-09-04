"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";

import { accountAuthHomeActionsSectionStyles } from "./AccountAuthHomeActionsSection.styles";
import type { AccountAuthHomeActionsSectionProps } from "./AccountAuthHomeActionsSection.types";

export function AccountAuthHomeActionsSection({
  otpLabel,
  passwordLabel,
}: AccountAuthHomeActionsSectionProps) {
  const styles = accountAuthHomeActionsSectionStyles();
  const router = useRouter();

  return (
    <section className={styles.root()}>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        className={styles.primary()}
        onPress={() => router.push("/auth/otp")}
      >
        <Icon name="mobile" size={20} />
        {otpLabel}
        <Icon name="chevron-left" size={18} />
      </Button>
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        className={styles.secondary()}
        onPress={() => router.push("/auth/login")}
      >
        <Icon name="lock-2" size={20} />
        {passwordLabel}
        <Icon name="chevron-left" size={18} />
      </Button>
    </section>
  );
}
