"use client";

import { useRef, useState } from "react";
import { Button, Modal, TextArea } from "@heroui/react";

type TextAction = {
  title: string;
  description?: string;
  initialValue?: string;
  minLength?: number;
  maxLength?: number;
  submitLabel?: string;
  onSubmit: (value: string) => Promise<unknown>;
};

/** Keeps the user's draft visible when validation or the request fails. */
export function useTextActionDialog() {
  const [action, setAction] = useState<TextAction | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const open = (next: TextAction) => {
    if (busy.current) return;
    setValue(next.initialValue ?? "");
    setError("");
    setAction(next);
  };
  const submit = async () => {
    if (!action || busy.current) return;
    const text = value.trim();
    if (
      text.length < (action.minLength ?? 2) ||
      text.length > (action.maxLength ?? 2000)
    ) {
      setError(
        `متن باید بین ${action.minLength ?? 2} و ${action.maxLength ?? 2000} نویسه باشد.`,
      );
      return;
    }
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await action.onSubmit(text);
      setAction(null);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "ثبت انجام نشد؛ متن شما حفظ شده است. دوباره تلاش کنید.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  const dialog = (
    <Modal.Backdrop
      isOpen={Boolean(action)}
      onOpenChange={(opened) => {
        if (!opened && !busy.current) setAction(null);
      }}
      variant="blur"
      isDismissable={!pending}
    >
      <Modal.Container size="md" scroll="inside">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{action?.title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-3">
            {action?.description ? (
              <p className="text-sm leading-7 text-muted">
                {action.description}
              </p>
            ) : null}
            <TextArea
              autoFocus
              aria-label={action?.title ?? "متن"}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={5}
              maxLength={action?.maxLength ?? 2000}
              disabled={pending}
              className="w-full"
            />
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              isDisabled={pending}
              onPress={() => setAction(null)}
            >
              انصراف
            </Button>
            <Button
              isPending={pending}
              isDisabled={pending || !value.trim()}
              onPress={() => void submit()}
            >
              {action?.submitLabel ?? "ثبت"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
  return { open, dialog };
}
