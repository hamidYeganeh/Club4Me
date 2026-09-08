"use client";

import { useMemo, useState } from "react";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { Icon, iconNames, type IconName } from "@theme/icon";

export function IconPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const icons = useMemo(
    () =>
      iconNames.filter((name) =>
        name.includes(search.trim().toLowerCase().replaceAll(" ", "-")),
      ),
    [search],
  );
  const selected = iconNames.includes(value as IconName)
    ? (value as IconName)
    : undefined;
  return (
    <div className="space-y-2">
      <Label>آیکن</Label>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          className="min-w-0 flex-1 justify-start"
          isDisabled={disabled}
          onPress={() => setOpen(true)}
        >
          <Icon name={selected ?? "grid-four"} size={24} />
          <span className="truncate" dir="ltr">
            {value || "انتخاب از آیکن‌های قالب"}
          </span>
        </Button>
        {value && (
          <Button
            variant="ghost"
            isDisabled={disabled}
            onPress={() => onChange("")}
          >
            پاک کردن
          </Button>
        )}
      </div>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen} variant="blur">
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog className="rounded-3xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>انتخاب آیکن</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <TextField value={search} onChange={setSearch} className="mb-4">
                <Label>جست‌وجوی نام آیکن (مانند swim، weight، star)</Label>
                <Input dir="ltr" autoFocus variant="secondary" />
              </TextField>
              <p role="status" className="mb-3 text-xs text-muted">
                {icons.length.toLocaleString("fa-IR")} آیکن
              </p>
              <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-5">
                {icons.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={value === name}
                    className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl p-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus ${value === name ? "bg-accent text-accent-foreground" : "bg-surface-secondary hover:bg-accent/15"}`}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                  >
                    <Icon name={name} size={30} />
                    <span dir="ltr" className="w-full break-words text-center">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
              {!icons.length && (
                <p className="py-8 text-center text-muted">
                  آیکنی با این نام پیدا نشد.
                </p>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
