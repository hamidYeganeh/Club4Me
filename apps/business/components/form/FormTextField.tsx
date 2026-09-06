"use client";

import type { ComponentProps, ReactNode } from "react";
import { FieldError, TextField } from "@heroui/react";
import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type TextFieldProps = ComponentProps<typeof TextField>;

export type FormTextFieldProps<TFieldValues extends FieldValues> = Omit<
  TextFieldProps,
  "name" | "value" | "onChange" | "isInvalid" | "children"
> & {
  name: FieldPath<TFieldValues>;
  transform?: (value: string) => string;
  children: ReactNode;
};

export function FormTextField<TFieldValues extends FieldValues>({
  name,
  transform,
  children,
  variant = "secondary",
  ...props
}: FormTextFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          variant={variant}
          name={field.name}
          value={typeof field.value === "string" ? field.value : ""}
          validationBehavior="aria"
          isInvalid={fieldState.invalid}
          onBlur={field.onBlur}
          onChange={(value) => {
            field.onChange(transform ? transform(value) : value);
          }}
        >
          {children}
          {fieldState.error?.message ? (
            <FieldError>{fieldState.error.message}</FieldError>
          ) : null}
        </TextField>
      )}
    />
  );
}
