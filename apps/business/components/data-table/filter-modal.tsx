"use client";

import { Button, Modal } from "@heroui/react";
import { Icon } from "@theme/icon";
import type { ReactNode } from "react";

type FilterModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  onApply: () => void;
  onReset: () => void;
  applyLabel?: string;
  resetLabel?: string;
  cancelLabel?: string;
};

export function FilterModal({
  isOpen,
  onOpenChange,
  title = "فیلترها",
  children,
  onApply,
  onReset,
  applyLabel = "اعمال فیلتر",
  resetLabel = "پاک کردن",
  cancelLabel = "انصراف",
}: FilterModalProps) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                <Icon name="funnel-2" size={18} />
              </Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4">{children}</Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={onReset}>
                {resetLabel}
              </Button>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                {cancelLabel}
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  onApply();
                  onOpenChange(false);
                }}
              >
                {applyLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
