"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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
  onBrowseRequest,
}: UploaderProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const labels = useMemo(
    () => ({ ...defaultUploaderLabels, ...labelsProp }),
    [labelsProp],
  );
  const isControlled = files !== undefined;
  const [internalFiles, setInternalFiles] = useState<UploaderFile[]>([]);
  const items = files ?? internalFiles;

  const patchFile = useCallback((id: string, next: Partial<UploaderFile>) => {
    setInternalFiles((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );
  }, []);

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

  const { getRootProps, getInputProps, isDragActive, isFocused, open } = useDropzone({
    onDropAccepted: (accepted) => {
      void handleAccepted(accepted);
    },
    onDropRejected: handleRejected,
    accept,
    maxSize,
    multiple,
    disabled,
    noClick: Boolean(onBrowseRequest),
    noKeyboard: Boolean(onBrowseRequest),
  });

  return (
    <div dir="rtl" className={cn("flex w-full flex-col gap-3", className)}>
      <motion.div
        {...getRootProps({
          onClick: onBrowseRequest ? () => onBrowseRequest(open) : undefined,
          onKeyDown: onBrowseRequest
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onBrowseRequest(open);
                }
              }
            : undefined,
          className: cn(
            "group relative isolate flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] bg-default p-2 text-center outline-none transition-colors duration-200 hover:bg-default/80",
            isDragActive && "bg-accent/10",
            isFocused &&
              "ring-2 ring-accent ring-offset-2 ring-offset-background",
            disabled && "pointer-events-none cursor-not-allowed opacity-50",
          ),
        })}
        animate={reduceMotion ? undefined : { scale: isDragActive ? 1.006 : 1 }}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.995 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        aria-label={labels.dropzoneAria}
      >
        <input {...getInputProps()} />
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-2 -z-10 rounded-[1.5rem] border border-dashed border-muted/30 bg-surface transition-[border-color,background-color] duration-200 group-hover:border-muted/50",
            isDragActive && "border-accent/70 bg-accent/5",
          )}
        />
        <motion.span
          aria-hidden="true"
          animate={
            reduceMotion
              ? undefined
              : { y: isDragActive ? -4 : 0, scale: isDragActive ? 1.08 : 1 }
          }
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "mb-3 grid size-11 place-items-center rounded-2xl bg-default text-foreground transition-colors duration-200",
            isDragActive && "bg-accent text-accent-foreground",
          )}
        >
          <UploadCloud className="size-[18px]" />
        </motion.span>
        <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
          {labels.clickToUpload}
        </p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted">
          {labels.dropHint.trim()} {labels.formats}
        </p>
      </motion.div>

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
