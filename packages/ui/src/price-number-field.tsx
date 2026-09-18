"use client";

import { Description, Label, NumberField } from "@heroui/react";
import { useEffect, useState } from "react";

import { formatRialAsTomanWords } from "./rial-toman";

const PRICE_FORMAT: Intl.NumberFormatOptions = {
  useGrouping: true,
  maximumFractionDigits: 0,
};

export type PriceNumberFieldProps = {
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

/** Money amount field with thousand separators and a toman-words description. */
export function PriceNumberField({
  label,
  name,
  value,
  defaultValue,
  minValue = 0,
  maxValue,
  step = 1,
  isRequired,
  isDisabled,
  className,
  "aria-label": ariaLabel,
  onChange,
}: PriceNumberFieldProps) {
  const [current, setCurrent] = useState(() =>
    normalizeNumber(value ?? defaultValue, minValue, minValue, maxValue),
  );

  useEffect(() => {
    if (value !== undefined) {
      setCurrent(normalizeNumber(value, minValue, minValue, maxValue));
    }
  }, [value, minValue, maxValue]);

  return (
    <NumberField
      name={name}
      value={current}
      minValue={minValue}
      maxValue={maxValue}
      step={step}
      isRequired={isRequired}
      isDisabled={isDisabled}
      aria-label={ariaLabel ?? label}
      locale="fa-IR"
      formatOptions={PRICE_FORMAT}
      onChange={(next) => {
        const normalized = normalizeNumber(next, minValue, minValue, maxValue);
        setCurrent(normalized);
        onChange?.(normalized);
      }}
      fullWidth
      variant="secondary"
      className={className}
    >
      {label ? (
        <Label>{label}</Label>
      ) : (
        <Label className="sr-only">{ariaLabel ?? name ?? "مبلغ"}</Label>
      )}
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input dir="ltr" className="text-start tabular-nums" />
        <NumberField.IncrementButton />
      </NumberField.Group>
      <Description>{formatRialAsTomanWords(current)}</Description>
    </NumberField>
  );
}
