"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";

import { accountAuthOtpHeaderSectionStyles } from "./AccountAuthOtpHeaderSection.styles";
import type { AccountAuthOtpHeaderSectionProps } from "./AccountAuthOtpHeaderSection.types";

export function AccountAuthOtpHeaderSection({
  backLabel,
  href = "/welcome",
}: AccountAuthOtpHeaderSectionProps) {
  const router = useRouter();
  const styles = accountAuthOtpHeaderSectionStyles();

  return (
    <header className={styles.root()}>
      <Button
        isIconOnly
        variant="secondary"
        size="lg"
        aria-label={backLabel}
        className={styles.back()}
        onPress={() => router.push(href)}
      >
        <Icon name="arrow-left" size={22} />
      </Button>
    </header>
  );
}
