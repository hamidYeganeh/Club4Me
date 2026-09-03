"use client";

import type { ComponentProps } from "react";
import { Fieldset } from "@heroui/react";

import { cn } from "@/lib/cn";

type FieldsetProps = ComponentProps<typeof Fieldset>;

function FormFieldsetRoot({ className, ...props }: FieldsetProps) {
  return (
    <Fieldset
      className={cn("flex w-full flex-col gap-6 border-0 p-0 shadow-none", className)}
      {...props}
    />
  );
}

export const FormFieldset = Object.assign(FormFieldsetRoot, {
  Legend: Fieldset.Legend,
  Group: Fieldset.Group,
  Actions: Fieldset.Actions,
});
