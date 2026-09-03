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
      {rail}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
