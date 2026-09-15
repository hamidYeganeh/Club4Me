"use client";

import { Button, InputGroup, Modal } from "@heroui/react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { EntityOptionContent, entityOptionText } from "./entity-option";

const media = "(max-width: 767px)";
const subscribe = (notify: () => void) => {
  const query = window.matchMedia(media);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
export function useMobileChoice() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(media).matches,
    () => false,
  );
}
export type ChoiceOption = {
  value: string;
  label: string;
  disabled?: boolean;
  entity?: unknown;
};
const normalize = (value: string) =>
  value.replace(/[يى]/g, "ی").replace(/ك/g, "ک").trim().toLocaleLowerCase("fa");

/** A touch picker with focus restoration, a scrollable list and form-value support. */
export function MobileChoiceField({
  options,
  value,
  onChange,
  multiple = false,
  label,
  labelledBy,
  describedBy,
  id,
  name,
  disabled,
  required,
  className,
  placeholder = "انتخاب کنید",
  footer,
  open: controlledOpen,
  onOpenChange,
}: {
  options: ChoiceOption[];
  value: string[];
  onChange: (value: string[]) => void;
  multiple?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const uid = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [localOpen, setLocalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState(label || placeholder);
  const open = controlledOpen ?? localOpen;
  const changeOpen = (next: boolean) => {
    setLocalOpen(next);
    onOpenChange?.(next);
    if (!next) requestAnimationFrame(() => trigger.current?.focus());
  };
  const selected = options.filter((option) => value.includes(option.value));
  const visible = options.filter((option) =>
    normalize(entityOptionText(option.entity, option.label)).includes(
      normalize(search),
    ),
  );
  return (
    <>
      <Button
        ref={trigger}
        id={id}
        type="button"
        variant="secondary"
        isDisabled={disabled}
        className={`min-h-12 w-full justify-between text-start ${className ?? ""}`}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${uid}-sheet` : undefined}
        onPress={() => {
          const external = labelledBy
            ?.split(" ")
            .map((key) => document.getElementById(key)?.textContent)
            .filter(Boolean)
            .join(" ");
          setTitle(
            label ||
              external ||
              trigger.current?.labels?.[0]?.textContent
                ?.replace(trigger.current?.textContent ?? "", "")
                .trim() ||
              placeholder,
          );
          setSearch("");
          changeOpen(true);
        }}
      >
        <span className="min-w-0 flex-1 truncate">
          {multiple ? (
            selected.length ? (
              `${selected.length.toLocaleString("fa-IR")} گزینه انتخاب‌شده`
            ) : (
              placeholder
            )
          ) : selected[0] ? (
            <EntityOptionContent
              compact
              entity={selected[0].entity}
              title={selected[0].label}
            />
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown size={18} className="shrink-0" aria-hidden />
      </Button>
      {name || required ? (
        <select
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          name={name}
          required={required}
          disabled={disabled}
          multiple={multiple}
          value={multiple ? value : (value[0] ?? "")}
          onChange={(event) =>
            onChange(
              Array.from(
                event.target.selectedOptions,
                (option) => option.value,
              ),
            )
          }
          onInvalid={(event) => {
            event.preventDefault();
            trigger.current?.focus();
            changeOpen(true);
          }}
        >
          {!multiple && !options.some((option) => option.value === "") ? (
            <option value="" />
          ) : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : null}
      <Modal.Backdrop
        isOpen={open}
        onOpenChange={changeOpen}
        style={{ zIndex: 1100, padding: 0 }}
        variant="blur"
      >
        <Modal.Container
          placement="bottom"
          size="md"
          scroll="inside"
          className="!m-0 !w-full !max-w-none !p-0"
        >
          <Modal.Dialog
            id={`${uid}-sheet`}
            data-bottom-sheet="true"
            dir="rtl"
            style={{
              maxHeight: "85dvh",
              borderRadius: "24px 24px 0 0",
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
            }}
          >
            <Modal.Header className="shrink-0 gap-3">
              <div
                aria-hidden
                className="mx-auto h-1 w-10 rounded-full bg-muted/30"
              />
              <div className="flex items-center justify-between gap-3">
                <Modal.Heading className="text-base">{title}</Modal.Heading>
                <Button
                  type="button"
                  isIconOnly
                  variant="ghost"
                  aria-label="بستن انتخاب‌گر"
                  onPress={() => changeOpen(false)}
                >
                  <X size={20} />
                </Button>
              </div>
              {options.length > 12 ? (
                <InputGroup className="w-full">
                  <InputGroup.Prefix>
                    <Search size={18} aria-hidden />
                  </InputGroup.Prefix>
                  <InputGroup.Input
                    aria-label="جست‌وجو در گزینه‌ها"
                    placeholder="جست‌وجو…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </InputGroup>
              ) : null}
            </Modal.Header>
            <Modal.Body className="min-h-0 overflow-y-auto overscroll-contain">
              <div role="group" aria-label={title} className="space-y-1">
                {visible.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      value.includes(option.value) ? "secondary" : "ghost"
                    }
                    isDisabled={option.disabled}
                    aria-pressed={value.includes(option.value)}
                    className="min-h-12 w-full justify-between whitespace-normal py-3 text-start"
                    onPress={() => {
                      onChange(
                        multiple
                          ? value.includes(option.value)
                            ? value.filter((key) => key !== option.value)
                            : [...value, option.value]
                          : [option.value],
                      );
                      if (!multiple) changeOpen(false);
                    }}
                  >
                    <EntityOptionContent
                      entity={option.entity}
                      title={option.label}
                    />
                    {value.includes(option.value) ? (
                      <Check
                        size={18}
                        className="shrink-0 text-accent"
                        aria-hidden
                      />
                    ) : null}
                  </Button>
                ))}
                {!visible.length ? (
                  <p
                    role="status"
                    className="py-8 text-center text-sm text-muted"
                  >
                    گزینه‌ای پیدا نشد.
                  </p>
                ) : null}
              </div>
              {footer}
            </Modal.Body>
            {multiple ? (
              <Modal.Footer>
                <Button
                  type="button"
                  className="min-h-12 w-full"
                  onPress={() => changeOpen(false)}
                >
                  تأیید انتخاب‌ها ({value.length.toLocaleString("fa-IR")})
                </Button>
              </Modal.Footer>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
