"use client";
import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import type { AccountAuthOtpHeaderSectionProps } from "./AccountAuthOtpHeaderSection.types";
export function AccountAuthOtpHeaderSection({
  backLabel,
  href = "/welcome",
}: AccountAuthOtpHeaderSectionProps) {
  return (
    <SecondaryHeader
      title="حساب کاربری"
      showFilter={false}
      backLabel={backLabel}
      backHref={href}
    />
  );
}
