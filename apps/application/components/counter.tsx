"use client";

import { Input as HeroInput } from "@heroui/react";
// The editable native input preserves validation, form data, and input events.
import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ComponentPropsWithRef } from "react";
import { normalizeNumberInput, numberInputError } from "@/lib/number-input";
import { cn } from "@/lib/cn";
import styles from "./counter.module.css";

export type CounterProps = Omit<
  ComponentPropsWithRef<"input">,
  "type" | "children"
>;

export function Counter({
  value,
  defaultValue,
  min,
  max,
  step = 1,
  disabled,
  readOnly,
  className,
  style,
  ref,
  onChange,
  onFocus,
  onBlur,
  ...props
}: CounterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(
    String(defaultValue ?? ""),
  );
  const [editing, setEditing] = useState(false);
  const current = String(value ?? internalValue);
  const numericValue = current === "" ? NaN : Number(current);
  const atMin =
    min !== undefined && current !== "" && numericValue <= Number(min);
  const atMax =
    max !== undefined && current !== "" && numericValue >= Number(max);
  const locked = disabled || readOnly;
  const formatted = Number.isFinite(numericValue)
    ? numericValue.toLocaleString("fa-IR", {
        maximumFractionDigits: 10,
        useGrouping: false,
      })
    : "";

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      numberInputError(current, min, max, step, Number(defaultValue) || 0),
    );
  }, [current, min, max, step, defaultValue]);

  useEffect(() => {
    if (value !== undefined) return;
    const form = inputRef.current?.form;
    let frame = 0;
    const reset = () => {
      frame = requestAnimationFrame(() =>
        setInternalValue(inputRef.current?.value ?? ""),
      );
    };
    form?.addEventListener("reset", reset);
    return () => {
      form?.removeEventListener("reset", reset);
      cancelAnimationFrame(frame);
    };
  }, [value]);

  function changeStep(direction: -1 | 1, restoreFocus: boolean) {
    const input = inputRef.current;
    if (!input || input.matches(":disabled") || input.readOnly) return;
    const previous = input.value;
    // A number proxy preserves browser stepping while the visible field accepts Persian digits.
    const proxy = document.createElement("input");
    proxy.type = "number";
    if (min !== undefined) proxy.min = String(min);
    if (max !== undefined) proxy.max = String(max);
    if (defaultValue !== undefined) proxy.defaultValue = String(defaultValue);
    proxy.step = step === "any" ? "1" : String(step);
    proxy.value = previous;
    if (direction === 1) proxy.stepUp();
    else proxy.stepDown();
    const next = proxy.value;
    if (next === previous) return;
    // Restore React's tracked value before dispatching a genuine input event.
    input.value = previous;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(input, next);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    // The action may disappear at its bound; keep keyboard focus in the control.
    if (
      restoreFocus &&
      ((direction === -1 && min !== undefined && Number(next) <= Number(min)) ||
        (direction === 1 && max !== undefined && Number(next) >= Number(max)))
    ) {
      input.focus({ preventScroll: true });
    }
  }

  return (
    <span
      data-counter=""
      data-disabled={disabled || undefined}
      className={cn(styles.root, className)}
      style={style}
      dir="ltr"
    >
      <span className={styles.center}>
        <HeroInput
          {...props}
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") return ref(node);
            if (ref) ref.current = node;
          }}
          type="text"
          role="spinbutton"
          aria-valuemin={min === undefined ? undefined : Number(min)}
          aria-valuemax={max === undefined ? undefined : Number(max)}
          aria-valuenow={
            Number.isFinite(numericValue) ? numericValue : undefined
          }
          inputMode={
            props.inputMode ??
            (Number.isInteger(Number(step)) ? "numeric" : "decimal")
          }
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          {...(value !== undefined ? { value } : { defaultValue })}
          className={styles.input}
          data-editing={editing || !formatted || undefined}
          onChange={(event) => {
            const next = normalizeNumberInput(event.target.value);
            event.target.value = next;
            event.target.setCustomValidity(
              numberInputError(next, min, max, step, Number(defaultValue) || 0),
            );
            setInternalValue(next);
            onChange?.(event);
          }}
          onFocus={(event) => {
            setEditing(true);
            onFocus?.(event);
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            if (
              !event.defaultPrevented &&
              !locked &&
              ["ArrowUp", "ArrowDown"].includes(event.key)
            ) {
              event.preventDefault();
              changeStep(event.key === "ArrowUp" ? 1 : -1, true);
            }
          }}
          onBlur={(event) => {
            onBlur?.(event);
            setInternalValue(event.target.value);
            setEditing(false);
          }}
        />
        {!editing && formatted ? (
          <span aria-hidden="true" className={styles.display}>
            {formatted}
          </span>
        ) : null}
      </span>
      {([-1, 1] as const).map((direction) => {
        const hidden = direction === -1 ? atMin : atMax;
        const ActionIcon = direction === -1 ? Minus : Plus;
        return (
          <button
            key={direction}
            type="button"
            aria-label={direction === -1 ? "کاهش مقدار" : "افزایش مقدار"}
            disabled={locked || hidden}
            className={cn(styles.action, direction === 1 && styles.plus)}
            onClick={(event) => changeStep(direction, event.detail === 0)}
          >
            <span aria-hidden="true" className={styles.icon}>
              <ActionIcon size={18} strokeWidth={2.5} />
            </span>
          </button>
        );
      })}
    </span>
  );
}
