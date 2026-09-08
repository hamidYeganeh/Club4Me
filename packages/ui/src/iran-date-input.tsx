"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { iranDateInputValue, parseIranDateInput } from "./iran-date";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "min" | "max"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  withTime?: boolean;
  min?: string;
  max?: string;
};

/** A civil Jalali date. API values remain Gregorian; instants are converted separately. */
export function IranDateInput({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  withTime = false,
  name,
  min,
  max,
  ...props
}: Props) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const value = controlledValue ?? localValue;
  const [draft, setDraft] = useState({
    source: value,
    text: iranDateInputValue(value, withTime),
  });
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => {
      setLocalValue(defaultValue);
      setDraft({
        source: defaultValue,
        text: iranDateInputValue(defaultValue, withTime),
      });
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, withTime]);
  const text =
    draft.source === value ? draft.text : iranDateInputValue(value, withTime);
  const parsed = text ? parseIranDateInput(text, withTime) : "";
  const invalid = Boolean(
    text && (!parsed || (min && parsed < min) || (max && parsed > max)),
  );
  useEffect(() => {
    input.current?.setCustomValidity(
      invalid ? "تاریخ شمسی معتبر و در بازه مجاز وارد کنید." : "",
    );
  }, [invalid]);
  return (
    <>
      <input
        {...props}
        ref={input}
        type="text"
        dir="ltr"
        value={text}
        placeholder={
          props.placeholder ?? (withTime ? "۱۴۰۵/۰۶/۲۱ ۱۸:۳۰" : "۱۴۰۵/۰۶/۲۱")
        }
        aria-description={
          withTime
            ? "تاریخ شمسی و ساعت تهران، سال/ماه/روز ساعت:دقیقه"
            : "تاریخ شمسی، سال/ماه/روز"
        }
        aria-invalid={invalid || undefined}
        onChange={(event) => {
          const next = event.target.value;
          const parsed = parseIranDateInput(next, withTime) ?? "";
          setDraft({ source: parsed, text: next });
          setLocalValue(parsed);
          onValueChange?.(parsed);
        }}
      />
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          disabled={props.disabled}
        />
      )}
    </>
  );
}
