"use client";

import { buttonVariants, type ButtonVariants } from "@heroui/styles";
import { cn } from "@theme/cn";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonLinkProps = ButtonVariants &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    className?: string;
    children?: ReactNode;
  };

export function ButtonLink({
  href,
  className,
  variant,
  size,
  isIconOnly,
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        buttonVariants({ fullWidth, isIconOnly, size, variant }),
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
