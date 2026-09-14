"use client";
import { useState, useRef, useEffect } from "react";
import { Button, Modal } from "@heroui/react";
export function useConfirmActionDialog() {
  const [message, setMessage] = useState<string | null>(null);
  const resolve = useRef<((value: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      resolve.current?.(false);
    },
    [],
  );
  const confirm = (text: string) =>
    new Promise<boolean>((done) => {
      resolve.current?.(false);
      resolve.current = done;
      setMessage(text);
    });
  const finish = (value: boolean) => {
    resolve.current?.(value);
    resolve.current = null;
    setMessage(null);
  };
  return {
    confirm,
    dialog: (
      <Modal.Backdrop
        isOpen={message !== null}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>تأیید تغییر</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="leading-7">{message}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                autoFocus
                variant="secondary"
                onPress={() => finish(false)}
              >
                انصراف
              </Button>
              <Button onPress={() => finish(true)}>تأیید و ادامه</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    ),
  };
}
