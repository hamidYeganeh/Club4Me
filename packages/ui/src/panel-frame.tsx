import type { ReactNode } from "react";

export type PanelFrameProps = {
  rail: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PanelFrame({
  rail,
  header,
  children,
  className,
}: PanelFrameProps) {
  return (
    <div
      className={[
        "flex min-h-dvh flex-col bg-background text-foreground lg:flex-row",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a className="panel-skip-link" href="#panel-content">رفتن به محتوای اصلی</a>
      {rail}
      <div className="panel-frame-main flex min-w-0 flex-1 flex-col">
        {header}
        <div id="panel-content" tabIndex={-1} className="panel-frame-body flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
