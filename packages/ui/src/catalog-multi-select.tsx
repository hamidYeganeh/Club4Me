"use client";

import { MobileChoiceField, useMobileChoice } from "./mobile-choice-field";
import { Button, ComboBox, Input, Label, ListBox } from "@heroui/react";

type Option = { id: string; name: string };
/** Search and add catalog entries; selected relations remain visible and removable. */
export function CatalogMultiSelect({
  label,
  options,
  value,
  onChange,
  isPending,
  isError,
  onRetry,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const mobile = useMobileChoice();
  const resolved = [
    ...options,
    ...value
      .filter((id) => !options.some((item) => item.id === id))
      .map((id, index) => ({ id, name: `گزینه ثبت‌شده ${index + 1}` })),
  ];
  return (
    <div className="min-w-0 space-y-2">
      {mobile ? (
        <div className="space-y-2">
          <Label>{label}</Label>
          <MobileChoiceField
            label={label}
            multiple
            value={value}
            onChange={onChange}
            disabled={isPending || isError}
            options={resolved.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </div>
      ) : (
        <ComboBox
          menuTrigger="input"
          variant="secondary"
          className="w-full"
          selectionMode="multiple"
          value={value}
          onChange={(keys) => {
            if (!Array.isArray(keys)) return;
            const next = keys.map(String);
            if (
              next.length !== value.length ||
              next.some((id, index) => id !== value[index])
            )
              onChange(next);
          }}
          isDisabled={isPending || isError}
        >
          <Label>{label}</Label>
          <ComboBox.InputGroup>
            <Input
              placeholder={
                isPending ? "در حال دریافت گزینه‌ها…" : "جست‌وجو و انتخاب…"
              }
            />
            <ComboBox.Trigger aria-label={`نمایش ${label}`} />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox
              selectionMode="multiple"
              renderEmptyState={() => "گزینه‌ای یافت نشد"}
            >
              {resolved.map((item) => (
                <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
                  {item.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      )}
      <div className="flex flex-wrap gap-2">
        {value.map((id, index) => {
          const name =
            options.find((item) => item.id === id)?.name ??
            `گزینه ثبت‌شده ${index + 1}`;
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="secondary"
              aria-label={`حذف ${name}`}
              onPress={() => onChange(value.filter((item) => item !== id))}
            >
              {name}
              <span aria-hidden="true">×</span>
            </Button>
          );
        })}
      </div>
      {isError && (
        <div role="alert" className="text-sm text-danger">
          دریافت گزینه‌ها انجام نشد.{" "}
          <Button type="button" size="sm" variant="ghost" onPress={onRetry}>
            تلاش دوباره
          </Button>
        </div>
      )}
      {!isPending && !isError && !options.length && (
        <p className="text-xs text-muted">
          هنوز گزینه‌ای توسط مدیر تعریف نشده است.
        </p>
      )}
    </div>
  );
}
