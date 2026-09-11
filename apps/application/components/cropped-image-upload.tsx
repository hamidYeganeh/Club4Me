"use client";

import { useState } from "react";
import { Uploader, imageUploaderAccept } from "@ui/uploader";
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
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div>
      <Uploader
        files={[]}
        multiple={false}
        accept={imageUploaderAccept}
        disabled={pending || disabled}
        labels={{ clickToUpload: label }}
        onDrop={([selected]) => {
          if (selected) setFile(selected);
        }}
      />
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
