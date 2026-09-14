"use client";

import { useCreateMedia, useMedia } from "@api";
import { Button } from "@heroui/react";
import { Uploader, imageUploaderAccept } from "@repo/ui/uploader";
import Image from "next/image";
import { useState } from "react";

export function MediaPicker({
  label,
  value,
  onChange,
  limit = 20,
  onBusyChange,
}: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
  limit?: number;
  onBusyChange: (busy: boolean) => void;
}) {
  const media = useMedia(value);
  const upload = useCreateMedia();
  const [urls, setUrls] = useState<Record<string, string>>({});
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <Uploader
        hideCompletedFiles
        multiple={false}
        accept={imageUploaderAccept}
        disabled={upload.isPending || value.length >= limit}
        labels={{
          clickToUpload: `افزودن ${label}`,
          formats: "JPG، PNG، WebP (حداکثر ۱۰ مگابایت)",
        }}
        onUpload={async (file) => {
          onBusyChange(true);
          try {
            const item = await upload.mutateAsync(file);
            setUrls((old) => ({ ...old, [item.id]: item.url }));
            onChange([...value, item.id]);
          } finally {
            onBusyChange(false);
          }
        }}
      />
      <div className="flex flex-wrap gap-3">
        {value.map((id, index) => {
          const url =
            urls[id] ?? media.data?.items.find((item) => item.id === id)?.url;
          return (
            <div key={id} className="w-28 space-y-1">
              {url ? (
                <Image
                  unoptimized
                  src={url}
                  width={112}
                  height={80}
                  alt={`${label} ${index + 1}`}
                  className="h-20 w-28 rounded-xl object-cover"
                />
              ) : (
                <p className="p-3 text-xs text-muted">
                  {media.isError ? "تصویر دریافت نشد" : "در حال دریافت تصویر…"}
                </p>
              )}
              <Button
                isDisabled={upload.isPending}
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`حذف ${label} ${index + 1}`}
                onPress={() => onChange(value.filter((item) => item !== id))}
              >
                حذف تصویر
              </Button>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
