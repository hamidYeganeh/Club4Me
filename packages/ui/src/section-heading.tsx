import type { ReactNode } from "react";
import { cn } from "./cn";

/** Sandow Sub Nav composition with logical alignment for RTL and long labels. */
export function SectionHeading({
  id,
  title,
  description,
  icon,
  action,
  className,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-3 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {icon ? (
            <span aria-hidden className="shrink-0">
              {icon}
            </span>
          ) : null}
          <h2
            id={id}
            className="app-section-heading min-w-0 text-lg leading-7 font-bold"
          >
            {title}
          </h2>
        </div>
        {description ? (
          <div className="mt-1 text-sm leading-6 text-muted">{description}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
