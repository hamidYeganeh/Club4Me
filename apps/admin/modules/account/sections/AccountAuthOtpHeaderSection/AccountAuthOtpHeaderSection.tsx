"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@theme/icon";

import type { AccountAuthOtpHeaderSectionProps } from "./AccountAuthOtpHeaderSection.types";

export function AccountAuthOtpHeaderSection({
  backLabel,
  href = "/welcome",
}: AccountAuthOtpHeaderSectionProps) {
  const router = useRouter();

  return (
    <nav className="mb-6 flex w-full items-center" aria-label={backLabel}>
      <button
        type="button"
        aria-label={backLabel}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={() => router.push(href)}
      >
        <Icon name="arrow-left" size={22} />
      </button>
    </nav>
  );
}
