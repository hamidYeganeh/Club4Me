"use client";

import { useState } from "react";
import { Button, Radio, RadioGroup } from "@heroui/react";
import { Icon, type IconName } from "@theme/icon";

import { BottomSheet } from "@/components/motion/bottom-sheet";

export type SortOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon: IconName;
};

export function SortBottomSheet<TValue extends string>({
  open,
  onOpenChange,
  value,
  onApply,
  title,
  description,
  applyLabel = "اعمال",
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TValue;
  onApply: (value: TValue) => void;
  title: string;
  description: string;
  applyLabel?: string;
  options: ReadonlyArray<SortOption<TValue>>;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[options.length > 2 ? 0.64 : 0.54, 0.9]}
      title={title}
      description={description}
      headerAction={
        <Button
          isIconOnly
          variant="ghost"
          aria-label="بستن"
          onPress={() => onOpenChange(false)}
          className="size-10 min-w-10 rounded-full text-muted"
        >
          <Icon name="close-x" size={24} />
        </Button>
      }
    >
      <SortSheetForm
        key={`${open}-${value}`}
        value={value}
        onApply={onApply}
        onClose={() => onOpenChange(false)}
        title={title}
        applyLabel={applyLabel}
        options={options}
      />
    </BottomSheet>
  );
}

function SortSheetForm<TValue extends string>({
  value,
  onApply,
  onClose,
  title,
  applyLabel,
  options,
}: {
  value: TValue;
  onApply: (value: TValue) => void;
  onClose: () => void;
  title: string;
  applyLabel: string;
  options: ReadonlyArray<SortOption<TValue>>;
}) {
  const [draftValue, setDraftValue] = useState(value);

  return (
    <form
      className="flex min-h-full flex-col pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draftValue);
        onClose();
      }}
    >
      <RadioGroup
        value={draftValue}
        onChange={(nextValue) => setDraftValue(nextValue as TValue)}
        aria-label={title}
        className="gap-3"
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            className="group mt-0! w-full rounded-[1.35rem] border border-border bg-surface-secondary/70 shadow-sm transition-[border-color,background-color,transform] data-[selected=true]:border-accent data-[selected=true]:bg-accent/8 active:scale-[0.99]"
          >
            <Radio.Content className="flex min-h-20 w-full flex-row-reverse gap-4 px-5 py-4 text-base font-bold">
              <Icon
                name={option.icon}
                size={24}
                className="shrink-0 text-muted transition-colors group-data-[selected=true]:text-accent"
              />
              <span className="min-w-0 flex-1 text-start text-foreground">
                {option.label}
              </span>
              <Radio.Control className="size-6 rounded-full border border-border bg-surface shadow-none group-data-[selected=true]:border-accent group-data-[selected=true]:bg-surface">
                <Radio.Indicator>
                  <span className="size-2 rounded-full bg-accent opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                </Radio.Indicator>
              </Radio.Control>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-auto w-full gap-3 rounded-[1.35rem] font-black"
      >
        {applyLabel}
        <Icon name="check" size={22} />
      </Button>
    </form>
  );
}
