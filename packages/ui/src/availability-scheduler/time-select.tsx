"use client";
import { MobileChoiceField, useMobileChoice } from "../mobile-choice-field";
import { Select, ListBox } from "@heroui/react";
import type { TimeOption } from "./types";
export function TimeSelect({
  value,
  onChange,
  open,
  onOpenChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: TimeOption[];
}) {
  const mobile = useMobileChoice();
  if (mobile)
    return (
      <MobileChoiceField
        label="زمان"
        value={[value]}
        onChange={(keys) => onChange(keys[0] ?? "")}
        open={open}
        onOpenChange={onOpenChange}
        options={options}
      />
    );
  return (
    <Select
      aria-label="زمان"
      value={value}
      onChange={(key) => onChange(String(key))}
      isOpen={open}
      onOpenChange={onOpenChange}
      className="w-full"
    >
      <Select.Trigger className="tabular-nums">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox className="max-h-56">
          {options.map((option) => (
            <ListBox.Item
              id={option.value}
              key={option.value}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
