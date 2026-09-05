"use client";

import { Button, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

type BarcodeDetectorLike = {
  detect(source: HTMLVideoElement): Promise<Array<{ rawValue: string }>>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

export function QrScannerButton({
  onScan,
}: {
  onScan: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let frame = 0;
    const start = async () => {
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector;
      if (!Detector) {
        toast.danger(
          "اسکن QR در این مرورگر پشتیبانی نمی‌شود؛ کد ۵ رقمی را وارد کنید",
        );
        setOpen(false);
        return;
      }
      try {
        stream.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!video.current || !active) return;
        video.current.srcObject = stream.current;
        await video.current.play();
        const detector = new Detector({ formats: ["qr_code"] });
        const scan = async () => {
          if (!active || !video.current) return;
          try {
            const [result] = await detector.detect(video.current);
            if (result?.rawValue) {
              onScan(result.rawValue);
              setOpen(false);
              toast.success("QR خوانده شد");
              return;
            }
          } catch {
            /* frame not ready */
          }
          frame = requestAnimationFrame(() => void scan());
        };
        void scan();
      } catch {
        toast.danger("دسترسی دوربین داده نشد");
        setOpen(false);
      }
    };
    void start();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, [onScan, open]);

  return (
    <>
      <Button
        className="mt-3 w-full"
        variant="secondary"
        onPress={() => setOpen(true)}
      >
        اسکن QR با دوربین
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-surface p-4">
            <video
              ref={video}
              playsInline
              muted
              className="aspect-square w-full rounded-2xl bg-black object-cover"
            />
            <p className="mt-3 text-center text-sm text-muted">
              QR نمایش‌داده‌شده در باشگاه را داخل کادر بگیرید.
            </p>
            <Button
              className="mt-3 w-full"
              variant="danger-soft"
              onPress={() => setOpen(false)}
            >
              بستن دوربین
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
