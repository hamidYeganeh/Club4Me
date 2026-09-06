"use client";

import { Label, NumberField } from "@heroui/react";

type PanelNumberFieldProps = {
  label?: string;
  name?: string;
  value?: number;
  defaultValue?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  "aria-label"?: string;
  onChange?: (value: number) => void;
};

function normalizeNumber(
  value: number | undefined,
  fallback: number,
  minValue?: number,
  maxValue?: number,
) {
  let next =
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  next = Math.round(next);
  if (typeof minValue === "number") next = Math.max(minValue, next);
  if (typeof maxValue === "number") next = Math.min(maxValue, next);
  return next;
}

export function PanelNumberField({
  label,
  name,
  value,
  defaultValue,
  minValue,
  maxValue,
  step = 1,
  isRequired,
  isDisabled,
  className,
  "aria-label": ariaLabel,
  onChange,
}: PanelNumberFieldProps) {
  return (
    <NumberField
      name={name}
      value={value}
      defaultValue={defaultValue}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      isRequired={isRequired}
      isDisabled={isDisabled}
      aria-label={ariaLabel ?? label}
      onChange={
        onChange
          ? (next) =>
              onChange(normalizeNumber(next, minValue ?? 0, minValue, maxValue))
          : undefined
      }
      fullWidth
      variant="secondary"
      className={className}
    >
      {label ? (
        <Label>{label}</Label>
      ) : (
        <Label className="sr-only">{ariaLabel ?? name ?? "number"}</Label>
      )}
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
    </NumberField>
  );
}
