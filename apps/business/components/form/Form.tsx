"use client";

import type { ComponentProps } from "react";
import { Form as HeroUIForm } from "@heroui/react";
import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

type HeroUIFormProps = ComponentProps<typeof HeroUIForm>;

export type FormProps<TFieldValues extends FieldValues> = Omit<
  HeroUIFormProps,
  "onSubmit"
> & {
  form: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
};

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  ...props
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <HeroUIForm
        validationBehavior="aria"
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        {children}
      </HeroUIForm>
    </FormProvider>
  );
}
