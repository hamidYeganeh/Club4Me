"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { Icon } from "@theme/icon";

export function DiscoveryFilterSheet({
  children,
  title = "فیلتر نتایج",
  activeCount = 0,
  resultCount,
}: {
  children: ReactNode;
  title?: string;
  activeCount?: number;
  resultCount?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        className="self-start"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPress={() => setOpen(true)}
      >
        <Icon name="funnel-1" size={20} />
        {title}
        {activeCount > 0 ? (
          <span
            className="grid min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground"
            aria-label={`${activeCount.toLocaleString("fa-IR")} فیلتر فعال`}
          >
            {activeCount.toLocaleString("fa-IR")}
          </span>
        ) : null}
      </Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={title}
        snapPoints={[0.85]}
      >
        <div className="space-y-5">
          {children}
          <div className="sticky bottom-0 bg-overlay pb-2 pt-3">
            <Button className="w-full" onPress={() => setOpen(false)}>
              {resultCount === undefined
                ? "نمایش نتایج"
                : `نمایش ${resultCount.toLocaleString("fa-IR")} نتیجه`}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
