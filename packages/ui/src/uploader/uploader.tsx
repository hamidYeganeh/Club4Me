"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Icon } from "@repo/theme/icon";

import { cn } from "../cn";
import { createUploaderFileId } from "./format";
import { defaultUploaderLabels } from "./labels";
import type { UploaderFile, UploaderProps } from "./types";
import { UploaderFileItem } from "./uploader-file-item";

const defaultAccept = {
  "image/svg+xml": [".svg"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const tenMegabytes = 10 * 1024 * 1024;

function toUploaderFile(
  file: File,
  status: UploaderFile["status"],
  progress = status === "success" ? 100 : 0,
): UploaderFile {
  return {
    id: createUploaderFileId(),
    name: file.name,
    size: file.size,
    loaded: status === "success" ? file.size : 0,
    progress,
    status,
    file,
  };
}

async function runUpload(
  item: UploaderFile,
  onUpload: NonNullable<UploaderProps["onUpload"]>,
  patch: (id: string, next: Partial<UploaderFile>) => void,
) {
  if (!item.file) {
    return;
  }

  patch(item.id, { status: "uploading", progress: 0, loaded: 0 });

  try {
    await onUpload(item.file, {
      onProgress: (loaded, total) => {
        const size = total || item.size;
        patch(item.id, {
          loaded,
          size,
          progress: size > 0 ? Math.min(100, (loaded / size) * 100) : 0,
        });
      },
    });
    patch(item.id, {
      status: "success",
      progress: 100,
      loaded: item.size,
    });
  } catch {
    patch(item.id, { status: "error" });
  }
}

export function Uploader({
  files,
  accept = defaultAccept,
  maxSize = tenMegabytes,
  multiple = true,
  disabled = false,
  className,
  labels: labelsProp,
  onDrop,
  onRemove,
  onRetry,
  onUpload,
}: UploaderProps) {
  const labels = useMemo(
    () => ({ ...defaultUploaderLabels, ...labelsProp }),
    [labelsProp],
  );
  const isControlled = files !== undefined;
  const [internalFiles, setInternalFiles] = useState<UploaderFile[]>([]);
  const items = files ?? internalFiles;

  const patchFile = useCallback(
    (id: string, next: Partial<UploaderFile>) => {
      setInternalFiles((current) =>
        current.map((item) => (item.id === id ? { ...item, ...next } : item)),
      );
    },
    [],
  );

  const handleAccepted = useCallback(
    async (accepted: File[]) => {
      onDrop?.(accepted);

      if (isControlled) {
        return;
      }

      const nextItems = accepted.map((file) =>
        toUploaderFile(file, onUpload ? "uploading" : "success"),
      );
      setInternalFiles((current) =>
        multiple ? [...current, ...nextItems] : nextItems.slice(-1),
      );

      if (!onUpload) {
        return;
      }

      await Promise.all(
        nextItems.map((item) => runUpload(item, onUpload, patchFile)),
      );
    },
    [isControlled, multiple, onDrop, onUpload, patchFile],
  );

  const handleRejected = useCallback(
    (rejections: FileRejection[]) => {
      if (isControlled) {
        return;
      }

      const rejectedItems = rejections.map((rejection) =>
        toUploaderFile(rejection.file, "error", 72),
      );
      setInternalFiles((current) => [...current, ...rejectedItems]);
    },
    [isControlled],
  );

  const handleRemove = useCallback(
    (id: string) => {
      onRemove?.(id);
      if (!isControlled) {
        setInternalFiles((current) => current.filter((item) => item.id !== id));
      }
    },
    [isControlled, onRemove],
  );

  const handleRetry = useCallback(
    (id: string) => {
      onRetry?.(id);
      if (isControlled) {
        return;
      }

      const item = internalFiles.find((entry) => entry.id === id);
      if (!item?.file || !onUpload) {
        patchFile(id, { status: "uploading", progress: 8, loaded: 0 });
        return;
      }

      void runUpload(item, onUpload, patchFile);
    },
    [internalFiles, isControlled, onRetry, onUpload, patchFile],
  );

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    onDropAccepted: (accepted) => {
      void handleAccepted(accepted);
    },
    onDropRejected: handleRejected,
    accept,
    maxSize,
    multiple,
    disabled,
    noKeyboard: false,
  });

  return (
    <div dir="rtl" className={cn("flex w-full flex-col gap-3", className)}>
      <div
        {...getRootProps({
          className: cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-accent bg-surface p-4 text-center outline-none transition-colors duration-200",
            isDragActive && "bg-accent/10",
            isFocused && "ring-2 ring-accent ring-offset-2 ring-offset-background",
            disabled && "cursor-not-allowed opacity-50",
          ),
        })}
        aria-label={labels.dropzoneAria}
      >
        <input {...getInputProps()} />
        <span className="flex size-16 items-center justify-center rounded-full bg-accent/15">
          <span className="flex size-10 items-center justify-center rounded-full border-2 border-accent text-accent">
            <Icon name="cloud-upload-1" size="md" />
          </span>
        </span>
        <p className="mt-3 text-sm text-foreground">
          <span className="font-bold text-accent">{labels.clickToUpload}</span>
          <span>{labels.dropHint}</span>
        </p>
        <p className="mt-1 max-w-xs text-xs leading-6 text-muted">
          {labels.formats}
        </p>
      </div>

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3" aria-live="polite">
          {items.map((item) => (
            <li key={item.id}>
              <UploaderFileItem
                item={item}
                labels={labels}
                onRemove={handleRemove}
                onRetry={handleRetry}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
