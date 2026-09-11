"use client";
import { Switch as HeroSwitch } from "@heroui/react";
export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
}
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  ariaLabel,
  className,
}: SwitchProps) {
  return (
    <HeroSwitch
      isSelected={checked}
      onChange={onCheckedChange}
      isDisabled={disabled}
      aria-label={ariaLabel ?? label}
      className={className}
    >
      <HeroSwitch.Content>
        <HeroSwitch.Control>
          <HeroSwitch.Thumb />
        </HeroSwitch.Control>
        {label}
      </HeroSwitch.Content>
    </HeroSwitch>
  );
}
