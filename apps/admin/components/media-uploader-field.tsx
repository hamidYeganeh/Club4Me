"use client";

import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  imageUploaderAccept,
  Uploader,
  type UploaderLabels,
} from "@ui/uploader";
import { useTranslations } from "next-intl";

type MediaUploaderFieldProps = {
  value?: string;
  label: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MediaUploaderField({
  value,
  label,
  disabled,
  onChange,
}: MediaUploaderFieldProps) {
  const t = useTranslations("uploader");
  const labels: UploaderLabels = {
    clickToUpload: t("clickToUpload"),
    dropHint: t("dropHint"),
    formats: t("formats"),
    progress: t("progress"),
    success: t("success"),
    error: t("error"),
    retry: t("retry"),
    remove: t("remove"),
    dropzoneAria: t("dropzoneAria"),
  };

  return (
    <section className="space-y-2 sm:col-span-2" aria-label={label}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-danger"
            onPress={() => onChange("")}
          >
            <Icon name="trash-1" />
            {t("remove")}
          </Button>
        ) : null}
      </div>
      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface-secondary p-2">
          {/* Uploaded files and existing remote assets are intentionally dynamic. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-44 w-full rounded-xl object-cover sm:h-52"
          />
          <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-b-xl bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10 text-xs text-white/80">
            {label}
          </div>
        </div>
      ) : null}
      <Uploader
        key={value ? "replace" : "empty"}
        multiple={false}
        disabled={disabled}
        accept={imageUploaderAccept}
        maxSize={10 * 1024 * 1024}
        labels={labels}
        className="admin-media-uploader"
        onDrop={(files) => {
          const file = files[0];
          if (file) void readAsDataUrl(file).then(onChange);
        }}
      />
    </section>
  );
}
