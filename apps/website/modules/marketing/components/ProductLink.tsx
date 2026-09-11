import { buttonVariants } from "@heroui/styles";
import type { ReactNode } from "react";

/** Native navigation with the same button styles as the application. */
export function ProductLink({
  href,
  children,
  size = "md",
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  size?: "md" | "lg";
  variant?: "primary" | "secondary";
}) {
  return (
    <a href={href} className={buttonVariants({ size, variant })}>
      {children}
    </a>
  );
}
