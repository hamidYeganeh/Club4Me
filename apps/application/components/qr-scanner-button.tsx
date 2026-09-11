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
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let frame = 0;
    const start = async () => {
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector;
      try {
        const acquired = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (!video.current || !active) {
          acquired.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = acquired;
        video.current.srcObject = stream.current;
        await video.current.play();
        const detector = Detector
          ? new Detector({ formats: ["qr_code"] })
          : null;
        const decode = detector ? null : (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        const scan = async () => {
          if (!active || !video.current) return;
          try {
            let result: { rawValue: string } | undefined;
            if (detector) [result] = await detector.detect(video.current);
            else if (decode && context && video.current.readyState >= 2) {
              const ratio = Math.min(1, 640 / video.current.videoWidth);
              canvas.width = Math.round(video.current.videoWidth * ratio);
              canvas.height = Math.round(video.current.videoHeight * ratio);
              context.drawImage(
                video.current,
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const pixels = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const code = decode(pixels.data, pixels.width, pixels.height, {
                inversionAttempts: "dontInvert",
              });
              if (code) result = { rawValue: code.data };
            }
            if (!active) return;
            if (result?.rawValue) {
              onScanRef.current(result.rawValue);
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
      } catch (error) {
        if (!active) return;
        const name = error instanceof DOMException ? error.name : "";
        toast.danger(
          name === "NotAllowedError"
            ? "اجازهٔ دوربین داده نشد؛ دسترسی دوربین را در تنظیمات برنامه یا مرورگر فعال کنید."
            : name === "NotFoundError"
              ? "دوربینی پیدا نشد؛ کد حضور را وارد کنید."
              : "دوربین باز نشد؛ برنامه‌های دیگرِ استفاده‌کننده از دوربین را ببندید و دوباره تلاش کنید.",
        );
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
  }, [open]);

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
