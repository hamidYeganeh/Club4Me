"use client";

import { EntityOptionContent, entityOptionText } from "./entity-option";
import { ComboBox, Input, ListBox, Select } from "@heroui/react";
import {
  Children,
  Fragment,
  isValidElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type OptionHTMLAttributes,
} from "react";

type OptionProps = OptionHTMLAttributes<HTMLOptionElement> & {
  entity?: unknown;
};
/** Declarative option data consumed by FormSelect; never rendered as native options. */
export function FormOption(_props: OptionProps) {
  return null;
}
function textContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textContent(child.props.children)
        : String(child),
    )
    .join("");
}
function optionsFrom(children: ReactNode): OptionProps[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionProps>(child)) return [];
    if (child.type === Fragment || child.type === "optgroup")
      return optionsFrom(child.props.children);
    return child.type === FormOption ? [child.props] : [];
  });
}
type Props = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "onChange" | "onBlur" | "onFocus" | "value" | "defaultValue" | "multiple"
> & {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
};
/** Shared HeroUI select for named HTML forms and controlled filters. */
export function FormSelect({
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className,
  name,
  id,
  autoFocus,
  autoComplete,
  ...aria
}: Props) {
  const options = optionsFrom(children);
  const firstEnabled = options.find((option) => !option.disabled);
  const initial =
    defaultValue ??
    (firstEnabled
      ? (firstEnabled.value ?? textContent(firstEnabled.children))
      : undefined);
  if (options.length > 12)
    return (
      <ComboBox
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        autoFocus={autoFocus}
        name={name}
        isDisabled={disabled}
        isRequired={required}
        className="min-w-0 w-full"
        {...(value !== undefined
          ? { selectedKey: String(value) }
          : {
              defaultSelectedKey:
                initial === undefined ? undefined : String(initial),
            })}
        onSelectionChange={(key) => onChange?.(key == null ? "" : String(key))}
        disabledKeys={options
          .filter((option) => option.disabled)
          .map((option) =>
            String(option.value ?? textContent(option.children)),
          )}
      >
        <ComboBox.InputGroup className={className}>
          <Input id={id} placeholder="جست‌وجو و انتخاب…" />
          <ComboBox.Trigger aria-label="نمایش گزینه‌ها" />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>
            {options.map((option) => {
              const key = String(option.value ?? textContent(option.children));
              return (
                <ListBox.Item
                  dir="rtl"
                  key={key}
                  id={key}
                  textValue={entityOptionText(
                    option.entity,
                    textContent(option.children),
                  )}
                >
                  <EntityOptionContent
                    entity={option.entity}
                    title={textContent(option.children)}
                  />
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              );
            })}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    );
  return (
    <Select
      placeholder="انتخاب کنید"
      aria-label={aria["aria-label"]}
      aria-labelledby={aria["aria-labelledby"]}
      aria-describedby={aria["aria-describedby"]}
      name={name}
      isDisabled={disabled}
      isRequired={required}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      className="min-w-0 w-full"
      {...(value !== undefined
        ? { value: String(value) }
        : {
            defaultValue: initial === undefined ? undefined : String(initial),
          })}
      onChange={(key) => onChange?.(key == null ? "" : String(key))}
      disabledKeys={options
        .filter((option) => option.disabled)
        .map((option) => String(option.value ?? textContent(option.children)))}
    >
      <Select.Trigger id={id} className={className}>
        <Select.Value>
          {({ defaultChildren, state }) => {
            const option = options.find(
              (option) =>
                String(option.value ?? textContent(option.children)) ===
                String(state.selectedItems[0]?.key),
            );
            return option ? (
              <EntityOptionContent
                compact
                entity={option.entity}
                title={textContent(option.children)}
              />
            ) : (
              defaultChildren
            );
          }}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => {
            const key = String(option.value ?? textContent(option.children));
            return (
              <ListBox.Item
                dir="rtl"
                key={key}
                id={key}
                textValue={entityOptionText(
                  option.entity,
                  textContent(option.children),
                )}
              >
                <EntityOptionContent
                  entity={option.entity}
                  title={textContent(option.children)}
                />
                <ListBox.ItemIndicator />
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
