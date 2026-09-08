import type { ReactNode } from "react";
import { Icon } from "@theme/icon";

export function TaskStatusIntro({ title, children, tone = "neutral" }: { title: string; children: ReactNode; tone?: "neutral" | "success" | "danger" }) {
  return <section className="app-card task-status-intro p-6 text-center" data-tone={tone}>
    <span className={`mx-auto mb-4 grid size-14 place-items-center rounded-2xl ${tone === "danger" ? "bg-danger/12 text-danger" : tone === "success" ? "bg-success/12 text-success" : "bg-accent/12 text-accent"}`} aria-hidden>
      <Icon name={tone === "success" ? "check" : tone === "danger" ? "close-x" : "calendar-check"} size={28} />
    </span>
    <h2 className="text-xl font-extrabold leading-9">{title}</h2>
    <div className="mt-2 text-sm leading-7 text-muted">{children}</div>
  </section>;
}
