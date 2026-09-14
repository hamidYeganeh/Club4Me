"use client";

import { Button, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { startQrScanner } from "@/lib/qr-scanner";

export function QrScannerButton({
  onScan,
}: {
  onScan: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        className="mt-3 w-full"
        variant="secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPress={() => setOpen(true)}
      >
        اسکن QR با دوربین
      </Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="اسکن QR"
        snapPoints={["auto"]}
      >
        {open ? (
          <ScannerCamera onScan={onScan} onClose={() => setOpen(false)} />
        ) : null}
      </BottomSheet>
    </>
  );
}

function ScannerCamera({
  onScan,
  onClose,
}: {
  onScan: (value: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const callbacks = useRef({ onScan, onClose });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    callbacks.current = { onScan, onClose };
  }, [onScan, onClose]);

  useEffect(() => {
    if (!video.current) return;
    return startQrScanner(video.current, {
      onReady: () => setReady(true),
      onScan: (value) => {
        callbacks.current.onClose();
        callbacks.current.onScan(value);
        toast.success("QR خوانده شد");
      },
      onError: (error) => {
        const name = error instanceof DOMException ? error.name : "";
        toast.danger(
          name === "NotAllowedError"
            ? "اجازهٔ دوربین داده نشد؛ دسترسی دوربین را در تنظیمات برنامه یا مرورگر فعال کنید."
            : name === "NotFoundError"
              ? "دوربینی پیدا نشد؛ کد حضور را وارد کنید."
              : "دوربین باز نشد؛ برنامه‌های دیگرِ استفاده‌کننده از دوربین را ببندید و دوباره تلاش کنید.",
        );
        callbacks.current.onClose();
      },
    });
  }, []);

  return (
    <div className="space-y-3">
      <video
        ref={video}
        playsInline
        muted
        autoPlay
        aria-label="پیش‌نمایش دوربین اسکن QR"
        className="aspect-square max-h-[50dvh] w-full rounded-2xl bg-black object-contain"
      />
      <p role="status" className="text-center text-sm text-muted">
        {ready
          ? "QR نمایش‌داده‌شده در باشگاه را کامل داخل کادر بگیرید."
          : "در حال آماده‌سازی دوربین…"}
      </p>
      <Button className="w-full" variant="danger-soft" onPress={onClose}>
        بستن دوربین
      </Button>
    </div>
  );
}
