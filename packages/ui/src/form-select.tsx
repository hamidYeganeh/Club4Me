"use client";

import { MobileChoiceField, useMobileChoice } from "./mobile-choice-field";
import { useEffect, useRef, useState } from "react";
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
export function FormOption(props: OptionProps) {
  void props; // Options are read declaratively by FormSelect.
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
export function FormSelect(props: Props) {
  const root = useRef<HTMLDivElement>(null);
  const options = optionsFrom(props.children);
  const first = options.find((option) => !option.disabled);
  const initial = String(
    props.defaultValue ??
      first?.value ??
      (first ? textContent(first.children) : ""),
  );
  const [localValue, setLocalValue] = useState(initial);
  useEffect(() => {
    const form = root.current?.closest("form");
    const reset = (event: Event) => {
      queueMicrotask(() => {
        if (!event.defaultPrevented && props.value === undefined)
          setLocalValue(initial);
      });
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [initial, props.value]);
  return (
    <div ref={root} className="min-w-0 w-full">
      <FormSelectControl
        {...props}
        value={props.value ?? localValue}
        onChange={(next) => {
          setLocalValue(next);
          props.onChange?.(next);
        }}
      />
    </div>
  );
}

function FormSelectControl({
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
  const mobile = useMobileChoice();
  const selectedValue = String(value ?? initial ?? "");
  const change = (next: string) => onChange?.(next);
  if (mobile)
    return (
      <MobileChoiceField
        options={options.map((option) => ({
          value: String(option.value ?? textContent(option.children)),
          label: textContent(option.children),
          entity: option.entity,
          disabled: option.disabled,
        }))}
        value={[selectedValue]}
        onChange={(keys) => change(keys[0] ?? "")}
        id={id}
        name={name}
        disabled={disabled}
        required={required}
        className={className}
        label={aria["aria-label"]}
        labelledBy={aria["aria-labelledby"]}
        describedBy={aria["aria-describedby"]}
      />
    );
  if (options.length > 12)
    return (
      <ComboBox
        variant="secondary"
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"]}
        aria-describedby={aria["aria-describedby"]}
        autoFocus={autoFocus}
        name={name}
        isDisabled={disabled}
        isRequired={required}
        className="min-w-0 w-full"
        selectedKey={selectedValue}
        onSelectionChange={(key) => change(key == null ? "" : String(key))}
        disabledKeys={options
          .filter((option) => option.disabled)
          .map((option) =>
            String(option.value ?? textContent(option.children)),
          )}
      >
        <ComboBox.InputGroup className={className}>
          <Input id={id} variant="secondary" placeholder="جست‌وجو و انتخاب…" />
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
      variant="secondary"
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
      value={selectedValue}
      onChange={(key) => change(key == null ? "" : String(key))}
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
