import { Card } from "@heroui/react";

export type CoachExperienceItem = {
  title: string;
  organization?: string;
  period?: string;
  description?: string;
};

export function CoachExperienceSection({ summary, items }: { summary?: string; items: CoachExperienceItem[] }) {
  if (!summary && !items.length) return null;
  return (
    <section className="app-reveal">
      <h2 className="mb-3 px-1 text-lg font-black text-foreground">تجربه حرفه‌ای</h2>
      <Card className="app-card p-5 shadow-none">
        {summary ? <p className="text-sm leading-8 text-muted">{summary}</p> : null}
        {items.length ? (
          <div className="mt-6">
            {items.map((item, index) => (
              <div key={`${item.title}-${index}`} className="relative flex gap-4 pb-7 last:pb-0">
                {index < items.length - 1 ? <span className="absolute right-[11px] top-6 h-[calc(100%-0.25rem)] w-0.5 bg-accent/55" /> : null}
                <span className={`relative z-10 mt-7 flex size-6 shrink-0 items-center justify-center rounded-full border-[5px] border-accent bg-background ${index === items.length - 1 ? "ring-4 ring-accent/20" : ""}`} />
                <div className="min-w-0 flex-1">
                  {item.period ? <p className="text-xs font-black tracking-wide text-muted">{item.period}</p> : null}
                  <h3 className="mt-2 text-base font-black text-foreground">{item.title}</h3>
                  {item.organization ? <p className="mt-1 text-sm font-bold text-accent">{item.organization}</p> : null}
                  {item.description ? <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
