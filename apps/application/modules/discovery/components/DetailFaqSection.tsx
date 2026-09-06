"use client";

import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { Accordion, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

export type DetailFaqItem = { question: string; answer: string };

export function DetailFaqSection({
  items,
  showEmpty = false,
}: {
  items?: DetailFaqItem[];
  showEmpty?: boolean;
}) {
  const visible = (items ?? []).filter(
    (item) => item.question.trim() && item.answer.trim(),
  );
  if (!visible.length)
    return showEmpty ? (
      <section className="space-y-3 pb-8">
        <h2 className="text-lg font-bold">سوالات متداول</h2>
        <ClubEmptyState
          title="هنوز پرسش و پاسخی ثبت نشده است"
          description="پاسخ باشگاه به پرسش‌های رایج اینجا نمایش داده می‌شود."
        />
      </section>
    ) : null;

  return (
    <section className="app-reveal w-full py-6">
      <Typography className="mb-3 px-1" type="h5">
        سوالات متداول
      </Typography>

      <Accordion
        aria-label="سوالات متداول"
        className="w-full border-y border-separator"
        hideSeparator
      >
        {visible.map((item, index) => (
          <Accordion.Item
            key={`${item.question}-${index}`}
            id={`${index}`}
            className="border-b border-separator last:border-b-0"
          >
            <Accordion.Heading>
              <Accordion.Trigger className="group min-h-20 w-full gap-3 px-1 py-5 text-start text-base font-bold text-foreground hover:bg-transparent data-[hovered=true]:bg-transparent">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <Icon
                    aria-hidden
                    className="shrink-0 text-muted"
                    name="question-mark-circle"
                    size={32}
                  />
                  <span className="min-w-0 leading-7">{item.question}</span>
                </span>
                <Accordion.Indicator className="ms-2 size-6 text-muted">
                  <Icon aria-hidden name="chevron-down" size={24} />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="text-base leading-8 text-muted [&_.accordion__body-inner]:px-1 [&_.accordion__body-inner]:pt-0 [&_.accordion__body-inner]:pb-6">
                {item.answer}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}
