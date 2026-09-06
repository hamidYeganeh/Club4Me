"use client";

import { Button, Typography } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";
import Image from "next/image";

import { cn } from "@/lib/cn";
import {
  getRequestFailurePresentation,
  type RequestFailureKind,
} from "@/lib/request-failure";

const icons: Record<RequestFailureKind, IconName> = {
  offline: "cloud-slash-1",
  timeout: "alarm",
  "permission-denied": "shield",
  "server-error": "cloud-1",
  unknown: "info",
};

export function RequestFailureState({
  error,
  onRetry,
  compact = false,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const failure = getRequestFailurePresentation(error);
  const showServerIllustration =
    failure.kind === "server-error" || failure.kind === "timeout";

  return (
    <div
      role="alert"
      aria-live="polite"
      data-state={failure.kind}
      className={cn(
        "flex flex-col items-center justify-center rounded-[1.5rem] border border-danger/20 bg-danger/7 px-5 text-center",
        compact ? "gap-2 py-5" : "gap-3 py-10",
        className,
      )}
    >
      {showServerIllustration ? (
        <Image
          src="/server-unavailable.png"
          alt=""
          width={750}
          height={560}
          unoptimized
          className={cn(
            "h-auto max-w-full object-cover",
            compact ? "w-40" : "w-64",
          )}
        />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-2xl bg-danger/12 text-danger">
          <Icon name={icons[failure.kind]} size={24} />
        </span>
      )}
      <div>
        <Typography type={compact ? "body" : "h5"} weight="bold">
          {failure.title}
        </Typography>
        <p className="mt-1 text-sm leading-6 text-muted">
          {failure.description}
        </p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
