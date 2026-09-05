"use client";

import { Card } from "@heroui/react";
import { Icon } from "@theme/icon";

export type DetailFaqItem = { question: string; answer: string };

export function DetailFaqSection({ items }: { items?: DetailFaqItem[] }) {
  const visible = (items ?? []).filter(
    (item) => item.question.trim() && item.answer.trim(),
  );
  if (!visible.length) return null;

  return (
    <Card className="app-card app-stack-card p-5 shadow-none">
      <Card.Title>سوالات متداول</Card.Title>
      <div className="mt-3 divide-y divide-white/8">
        {visible.map((item, index) => (
          <details key={`${item.question}-${index}`} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-bold text-foreground marker:hidden">
              <span>{item.question}</span>
              <Icon
                name="chevron-down"
                className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-4 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
