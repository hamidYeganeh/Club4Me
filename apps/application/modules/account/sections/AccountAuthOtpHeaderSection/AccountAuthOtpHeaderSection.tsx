"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";

import { accountAuthOtpHeaderSectionStyles } from "./AccountAuthOtpHeaderSection.styles";
import type { AccountAuthOtpHeaderSectionProps } from "./AccountAuthOtpHeaderSection.types";

export function AccountAuthOtpHeaderSection({
  backLabel,
  href = "/welcome",
  overlay = false,
  transparent = false,
}: AccountAuthOtpHeaderSectionProps) {
  const router = useRouter();
  const styles = accountAuthOtpHeaderSectionStyles({ overlay, transparent });

  return (
    <>
      <header className={styles.root()}>
        <Button
          isIconOnly
          variant="secondary"
          size="lg"
          aria-label={backLabel}
          className={styles.back()}
          onPress={() => router.push(href)}
        >
          <Icon name="chevron-right" size={22} />
        </Button>
      </header>
      <div aria-hidden className={styles.spacer()} />
    </>
  );
}
