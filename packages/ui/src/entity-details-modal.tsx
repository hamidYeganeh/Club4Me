"use client";

import { Button, Modal } from "@heroui/react";
import type { ReactNode } from "react";

export type EntityDetailItem = {
  label: string;
  value: ReactNode;
  dir?: "ltr" | "rtl";
  wide?: boolean;
};

export type EntityDetailSection = {
  title?: string;
  items: EntityDetailItem[];
};

type EntityDetailsModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: string;
  sections: EntityDetailSection[];
  closeLabel?: string;
};

export function EntityDetailsModal({
  isOpen,
  onOpenChange,
  title,
  description,
  sections,
  closeLabel = "بستن",
}: EntityDetailsModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
      <Modal.Container size="lg" scroll="inside">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted">
                {description}
              </p>
            ) : null}
          </Modal.Header>
          <Modal.Body className="space-y-5">
            {sections.map((section, sectionIndex) => (
              <section key={`${section.title ?? "details"}-${sectionIndex}`}>
                {section.title ? (
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>
                ) : null}
                <dl className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border border-border bg-surface-secondary p-3 ${item.wide ? "sm:col-span-2" : ""}`}
                    >
                      <dt className="text-xs text-muted">{item.label}</dt>
                      <dd
                        className="mt-1 break-words text-sm leading-6 text-foreground"
                        dir={item.dir}
                      >
                        {item.value === "" || item.value == null
                          ? "ثبت نشده"
                          : item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={() => onOpenChange(false)}>
              {closeLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
