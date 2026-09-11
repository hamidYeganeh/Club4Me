"use client";

import { Slider, Label } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";

/** All coordinates describe the same source rectangle used by the preview and export. */
export function ImageCropper({
  file,
  aspectRatio = 1,
  onCancel,
  onConfirm,
}: {
  file: File;
  aspectRatio?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ratio = aspectRatio || size.width / size.height || 1;
  const cropWidth = Math.min(size.width, size.height * ratio) / zoom;
  const cropHeight = cropWidth / ratio;
  const left = (size.width - cropWidth) * position.x;
  const top = (size.height - cropHeight) * position.y;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    dialog.current?.showModal();
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function confirm() {
    if (!image.current || !cropWidth || pending) return;
    setPending(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(cropWidth, cropHeight));
      canvas.width = Math.max(1, Math.round(cropWidth * scale));
      canvas.height = Math.max(1, Math.round(cropHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.drawImage(
        image.current,
        left,
        top,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const mime = file.type === "image/jpeg" ? "image/jpeg" : "image/png";
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("Encoding failed")),
          mime,
          0.9,
        ),
      );
      await onConfirm(
        new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "")}-cropped.${mime === "image/jpeg" ? "jpg" : "png"}`,
          { type: mime },
        ),
      );
    } catch {
      setError("آماده‌سازی تصویر انجام نشد. دوباره تلاش کنید.");
    } finally {
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="crop-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="m-auto max-h-[95dvh] w-[min(92vw,28rem)] overflow-y-auto rounded-3xl border border-border bg-background p-5 text-foreground backdrop:bg-black/70"
    >
      <h2 id="crop-title" className="mb-2 text-lg font-bold">
        برش تصویر
      </h2>
      <p className="mb-4 text-sm text-muted">
        تصویر را جابه‌جا کنید و اندازه برش را تنظیم کنید.
      </p>
      <div
        ref={preview}
        className="relative mx-auto touch-none overflow-hidden rounded-2xl bg-surface-secondary"
        style={{ aspectRatio: ratio, width: `min(100%, ${50 * ratio}dvh)` }}
        onPointerDown={(event) => {
          if (pending) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, left, top };
        }}
        onPointerMove={(event) => {
          if (!drag.current || !preview.current || !cropWidth) return;
          const scale = cropWidth / preview.current.clientWidth;
          setPosition({
            x:
              size.width === cropWidth
                ? 0.5
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (drag.current.left -
                        (event.clientX - drag.current.x) * scale) /
                        (size.width - cropWidth),
                    ),
                  ),
            y:
              size.height === cropHeight
                ? 0.5
                : Math.max(
                    0,
                    Math.min(
                      1,
                      (drag.current.top -
                        (event.clientY - drag.current.y) * scale) /
                        (size.height - cropHeight),
                    ),
                  ),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {/* Canvas export requires the original decoded image dimensions. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={image}
          alt="پیش‌نمایش برش"
          draggable={false}
          onLoad={(event) =>
            setSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            })
          }
          onError={() =>
            setError("این تصویر قابل خواندن نیست؛ تصویر دیگری انتخاب کنید.")
          }
          className="pointer-events-none absolute max-w-none object-cover"
          style={
            cropWidth
              ? {
                  width: `${(size.width / cropWidth) * 100}%`,
                  height: `${(size.height / cropHeight) * 100}%`,
                  left: `${(-left / cropWidth) * 100}%`,
                  top: `${(-top / cropHeight) * 100}%`,
                }
              : { width: "100%" }
          }
        />
      </div>
      <div className="my-4 space-y-3">
        {[
          { label: "بزرگ‌نمایی", value: zoom, min: 1, max: 4, set: setZoom },
          {
            label: "جابه‌جایی افقی",
            value: position.x,
            min: 0,
            max: 1,
            set: (x: number) => setPosition((value) => ({ ...value, x })),
          },
          {
            label: "جابه‌جایی عمودی",
            value: position.y,
            min: 0,
            max: 1,
            set: (y: number) => setPosition((value) => ({ ...value, y })),
          },
        ].map((control) => (
          <Slider key={control.label} aria-label={control.label} minValue={control.min} maxValue={control.max} step={0.01} value={control.value} isDisabled={pending} onChange={value => control.set(Array.isArray(value) ? value[0]! : value)} className="w-full" dir="ltr">
            <Label>{control.label}</Label><Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
          </Slider>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Button
          variant="primary"
          isDisabled={!cropWidth}
          isPending={pending}
          onPress={() => void confirm()}
        >
          تأیید برش
        </Button>
        <Button variant="secondary" isDisabled={pending} onPress={onCancel}>
          انصراف
        </Button>
      </div>
    </dialog>
  );
}
