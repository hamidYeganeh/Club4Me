"use client";

import { tv } from "tailwind-variants";

import {
  getPasswordStrength,
  type PasswordStrengthLabel,
  type PasswordStrengthLevel,
} from "@/lib/password-strength";

const passwordStrengthStyles = tv({
  slots: {
    root: "flex w-full flex-col gap-2",
    bars: "flex w-full gap-1.5",
    bar: "h-1.5 flex-1 rounded-full bg-separator/80 transition-[background-color,transform] duration-300 ease-out",
    label: "text-start text-xs font-medium transition-colors duration-300",
  },
  variants: {
    filled: {
      true: {
        bar: "scale-y-110",
      },
    },
    level: {
      0: {
        bar: "bg-separator/80",
        label: "text-muted",
      },
      1: {
        bar: "bg-danger",
        label: "text-danger",
      },
      2: {
        bar: "bg-warning",
        label: "text-warning",
      },
      3: {
        bar: "bg-accent",
        label: "text-accent",
      },
      4: {
        bar: "bg-success",
        label: "text-success",
      },
    },
  },
});

export type PasswordStrengthProps = {
  password: string;
  labels: Record<PasswordStrengthLabel, string>;
  className?: string;
};

export function PasswordStrength({
  password,
  labels,
  className,
}: PasswordStrengthProps) {
  const strength = getPasswordStrength(password);
  const styles = passwordStrengthStyles();
  const level = strength.score as PasswordStrengthLevel;

  return (
    <div className={styles.root({ className })}>
      <div
        className={styles.bars()}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={strength.score}
        aria-label={labels[strength.label]}
      >
        {([1, 2, 3, 4] as const).map((segment) => {
          const filled = segment <= strength.score;

          return (
            <span
              key={segment}
              className={styles.bar({
                filled,
                level: filled ? level : 0,
              })}
            />
          );
        })}
      </div>
      <p className={styles.label({ level })} aria-live="polite">
        {labels[strength.label]}
      </p>
    </div>
  );
}
