"use client";

import { useRouter } from "next/navigation";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

export function DiscoveryPageHeader({
  title,
  description,
  action,
  overlay = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  overlay?: boolean;
}) {
  const router = useRouter();
  const headerClass = overlay
    ? "app-header border-transparent bg-background/42 shadow-none"
    : "app-header";

  return (
    <>
      <header className={headerClass}>
        <Button
          isIconOnly
          variant="secondary"
          aria-label="بازگشت"
          onPress={() => router.back()}
          className="app-icon-button"
        >
          <Icon name="chevron-right" size={20} />
        </Button>
        <div className="min-w-0 flex-1">
          <Typography type="h5" weight="bold" className="tracking-tight">
            {title}
          </Typography>
          {description ? (
            <Typography
              type="body-sm"
              color="muted"
              className="mt-0.5 line-clamp-1 leading-5"
            >
              {description}
            </Typography>
          ) : null}
        </div>
        {action}
      </header>
      {overlay ? null : <div aria-hidden className="app-header-spacer" />}
    </>
  );
}
