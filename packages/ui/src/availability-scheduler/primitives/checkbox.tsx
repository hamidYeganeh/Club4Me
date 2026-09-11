"use client";
import { Checkbox as HeroCheckbox } from "@heroui/react";
export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}
export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  indeterminate,
  label,
  ...props
}: CheckboxProps) {
  return (
    <HeroCheckbox
      {...props}
      isSelected={checked}
      onChange={onCheckedChange}
      isDisabled={disabled}
      isIndeterminate={indeterminate}
    >
      <HeroCheckbox.Content>
        <HeroCheckbox.Control>
          <HeroCheckbox.Indicator />
        </HeroCheckbox.Control>
        {label}
      </HeroCheckbox.Content>
    </HeroCheckbox>
  );
}
