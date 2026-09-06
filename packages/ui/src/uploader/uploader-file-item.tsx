"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileAudio,
  FileCode2,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "../cn";
import { formatBytes, formatPercent } from "./format";
import type { UploaderFile, UploaderLabels } from "./types";

type UploaderFileItemProps = {
  item: UploaderFile;
  labels: UploaderLabels;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
};

function fileKind(item: UploaderFile) {
  const extension = item.name.includes(".")
    ? item.name.split(".").pop()?.toUpperCase()
    : undefined;
  return extension ?? item.file?.type.split("/").pop()?.toUpperCase() ?? "FILE";
}

function renderFileIcon(item: UploaderFile) {
  const extension = item.name.split(".").pop()?.toLowerCase();
  const type = item.file?.type ?? "";

  if (type.startsWith("image/")) return <FileImage className="size-5" />;
  if (type.startsWith("video/")) return <FileVideo className="size-5" />;
  if (type.startsWith("audio/")) return <FileAudio className="size-5" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension ?? ""))
    return <FileArchive className="size-5" />;
  if (["csv", "xls", "xlsx"].includes(extension ?? ""))
    return <FileSpreadsheet className="size-5" />;
  if (
    ["js", "jsx", "ts", "tsx", "json", "html", "css"].includes(extension ?? "")
  )
    return <FileCode2 className="size-5" />;
  if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension ?? ""))
    return <FileText className="size-5" />;
  return <FileIcon className="size-5" />;
}

export function UploaderFileItem({
  item,
  labels,
  onRemove,
  onRetry,
}: UploaderFileItemProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const progress = item.status === "success" ? 100 : item.progress;
  const progressRatio = Math.max(0, Math.min(100, progress)) / 100;

  return (
    <motion.article
      layout={!reduceMotion}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-surface p-3"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-default text-muted">
          {renderFileIcon(item)}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 items-start gap-2">
            <div className="min-w-0 flex-1 overflow-hidden text-start">
              <p
                className="truncate text-sm font-medium text-foreground"
                title={item.name}
                dir="auto"
              >
                {item.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                <span dir="ltr" className="tabular-nums">
                  {fileKind(item)} · {formatBytes(item.size)}
                </span>
                {item.status === "error" ? (
                  <span className="text-danger"> · {labels.error}</span>
                ) : null}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <span
                className={cn(
                  "grid size-7 place-items-center",
                  item.status === "uploading" && "text-foreground",
                  item.status === "success" && "text-success",
                  item.status === "error" && "text-danger",
                )}
                aria-label={
                  item.status === "success"
                    ? labels.success
                    : item.status === "error"
                      ? labels.error
                      : labels.progress
                }
              >
                {item.status === "uploading" ? (
                  <Loader2
                    className={cn("size-4", !reduceMotion && "animate-spin")}
                  />
                ) : null}
                {item.status === "success" ? (
                  <CheckCircle2 className="size-4" />
                ) : null}
                {item.status === "error" ? (
                  <AlertCircle className="size-4" />
                ) : null}
              </span>
              {item.status === "error" ? (
                <button
                  type="button"
                  className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-default hover:text-foreground active:scale-95"
                  onClick={() => onRetry?.(item.id)}
                  aria-label={labels.retry}
                >
                  <RotateCcw className="size-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-default hover:text-foreground active:scale-95"
                onClick={() => onRemove?.(item.id)}
                aria-label={labels.remove}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          {item.status !== "error" ? (
            <div
              className="mt-3 h-1.5 overflow-hidden rounded-full bg-default"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={item.name}
            >
              <motion.div
                className={cn(
                  "h-full origin-right rounded-full",
                  item.status === "uploading" ? "bg-foreground" : "bg-success",
                )}
                initial={false}
                animate={{ scaleX: progressRatio }}
                transition={{
                  duration: reduceMotion ? 0 : 0.28,
                  ease: "easeOut",
                }}
              />
            </div>
          ) : null}
          {item.status === "uploading" ? (
            <div className="mt-2 flex justify-between gap-2 text-xs text-muted">
              <span className="min-w-0 truncate tabular-nums" dir="ltr">
                {formatBytes(item.loaded)} / {formatBytes(item.size)}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPercent(progress)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
