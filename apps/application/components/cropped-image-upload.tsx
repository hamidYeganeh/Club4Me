"use client";

import { useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { ImageCropper } from "./image-cropper";

export function CroppedImageUpload({
  onFile,
  label = "انتخاب تصویر",
  aspectRatio = 0,
  disabled = false,
}: {
  onFile: (file: File) => Promise<void>;
  label?: string;
  aspectRatio?: number;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={pending || disabled}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(
              selected.type,
            ) ||
            selected.size > 10 * 1024 * 1024
          ) {
            toast.danger(
              "تصویر JPG، PNG یا WebP با حجم حداکثر ۱۰ مگابایت انتخاب کنید.",
            );
            return;
          }
          setFile(selected);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        isPending={pending}
        isDisabled={disabled}
        onPress={() => input.current?.click()}
      >
        {label}
      </Button>
      {file ? (
        <ImageCropper
          file={file}
          aspectRatio={aspectRatio}
          onCancel={() => setFile(null)}
          onConfirm={async (cropped) => {
            setPending(true);
            try {
              await onFile(cropped);
              setFile(null);
            } finally {
              setPending(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
