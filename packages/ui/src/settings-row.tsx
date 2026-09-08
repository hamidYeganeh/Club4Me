import type { ReactNode } from "react";
import { cn } from "./cn";

/** Presentational row: the caller owns labels, switches and persistence. */
export function SettingsRow({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-settings-row", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-base leading-6 font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
