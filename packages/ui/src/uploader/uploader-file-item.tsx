"use client";

import { Icon } from "@repo/theme/icon";

import { cn } from "../cn";
import { formatBytes, formatPercent } from "./format";
import type { UploaderFile, UploaderLabels } from "./types";

type UploaderFileItemProps = {
  item: UploaderFile;
  labels: UploaderLabels;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
};

const statusIcon = {
  uploading: "cloud-upload-1",
  success: "check",
  error: "exclamation-mark-triangle",
} as const;

export function UploaderFileItem({
  item,
  labels,
  onRemove,
  onRetry,
}: UploaderFileItemProps) {
  const progress = item.status === "success" ? 100 : item.progress;
  const showRemove = item.status !== "success";

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-[20px] border border-border bg-surface p-4",
        item.status === "success" && "border-success/20",
        item.status === "error" && "border-danger/20",
      )}
    >
      <span
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-full",
          item.status === "uploading" && "bg-accent/15 text-accent",
          item.status === "success" && "bg-success/15 text-success",
          item.status === "error" && "bg-danger/15 text-danger",
        )}
      >
        <Icon name={statusIcon[item.status]} size="lg" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate text-sm font-bold text-foreground">
            {item.name}
          </p>
          {item.status === "success" ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
              <Icon name="check" size="sm" />
            </span>
          ) : null}
          {showRemove ? (
            <button
              type="button"
              className="relative inline-flex size-6 shrink-0 items-center justify-center text-danger transition-transform after:absolute after:inset-[-12px] active:scale-95"
              onClick={() => onRemove?.(item.id)}
              aria-label={labels.remove}
            >
              <Icon name="trash-1" size="md" />
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-2 h-2 overflow-hidden rounded-full",
            item.status === "uploading" && "bg-default",
            item.status === "success" && "bg-success/20",
            item.status === "error" && "bg-danger/15",
          )}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={item.name}
        >
          <div
            className={cn(
              "h-full origin-right rounded-full transition-transform duration-200 ease-out motion-reduce:transition-none",
              item.status === "uploading" && "bg-accent",
              item.status === "success" && "bg-success",
              item.status === "error" && "bg-danger",
            )}
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          {item.status === "uploading" ? (
            <p className="text-xs text-muted">
              {labels.progress}: {formatBytes(item.loaded)} /{" "}
              {formatBytes(item.size)}
            </p>
          ) : null}
          {item.status === "success" ? (
            <p className="text-xs text-muted">{labels.success}</p>
          ) : null}
          {item.status === "error" ? (
            <p className="text-xs text-muted">{labels.error}</p>
          ) : null}

          {item.status === "error" ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-accent transition-transform active:scale-95"
              onClick={() => onRetry?.(item.id)}
            >
              <span>{labels.retry}</span>
              <Icon name="arrow-rotate-clockwise-1" size="sm" />
            </button>
          ) : (
            <p className="text-xs font-bold text-foreground">
              {formatPercent(progress)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
