"use client";

import { Button } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";
import type { ComponentPropsWithoutRef } from "react";

type ButtonLinkProps = Omit<ButtonProps, "render"> & {
  href: string;
};

export function ButtonLink({ href, ...props }: ButtonLinkProps) {
  return (
    <Button
      {...props}
      render={(buttonProps: ComponentPropsWithoutRef<"button">) => {
        const rest = { ...buttonProps };
        delete rest.type;
        return <a {...(rest as ComponentPropsWithoutRef<"a">)} href={href} />;
      }}
    />
  );
}
