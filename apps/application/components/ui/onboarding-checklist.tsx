"use client";

import { useId, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import Link from "@/components/app-link";
import { Icon } from "@theme/icon";
import {
  CONTROL_TRANSITION,
  FADE_TRANSITION,
  REDUCED_TRANSITION,
  MOTION_STAGGER,
} from "@/lib/ease";

export type ChecklistStep = {
  id: string;
  title: string;
  isCompleted: boolean;
  href: string;
};
export function OnboardingChecklist({
  steps,
  title = "پروفایلت را کامل کن",
}: {
  steps: ChecklistStep[];
  title?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const uid = useId();
  const reduced = useReducedMotion();
  const completed = steps.filter((step) => step.isCompleted).length;
  const remaining = steps.filter((step) => !step.isCompleted);
  const transition = reduced ? REDUCED_TRANSITION : CONTROL_TRANSITION;
  return (
    <LayoutGroup id={uid}>
      <motion.section
        layout={!reduced}
        transition={transition}
        className="overflow-hidden rounded-3xl bg-surface"
        aria-label="تکمیل پروفایل"
      >
        <button
          type="button"
          className="w-full rounded-3xl p-5 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          aria-expanded={expanded}
          aria-controls={`${uid}-steps`}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Icon
                name={remaining.length ? "user" : "check-circle"}
                size={23}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">
                {remaining.length ? title : "پروفایل کامل است"}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {remaining.length
                  ? `${remaining.length.toLocaleString("fa-IR")} مورد دیگر باقی مانده است.`
                  : "اطلاعات اصلی حسابت ثبت شده است."}
              </span>
            </span>
            <span className="inline-flex min-h-11 shrink-0 items-center rounded-2xl bg-accent px-3 text-xs font-bold text-accent-foreground">
              {expanded ? "بستن" : "تکمیل"}
            </span>
          </span>
          <motion.span
            layout={!reduced}
            className={`mt-5 flex items-center gap-2 ${expanded ? "justify-between" : ""}`}
            role="progressbar"
            aria-label="میزان تکمیل پروفایل"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completed}
          >
            {steps.map((step, index) => (
              <motion.span
                layout={!reduced}
                transition={{
                  ...transition,
                  delay: reduced ? 0 : Math.min(index, 5) * MOTION_STAGGER,
                }}
                key={step.id}
                className={`grid place-items-center rounded-full ${
                  expanded ? "size-7 flex-none" : "h-1.5 flex-1"
                } ${
                  step.isCompleted
                    ? "bg-accent text-accent-foreground"
                    : expanded
                      ? "bg-surface-tertiary text-foreground"
                      : "bg-surface-tertiary"
                }`}
              >
                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.span
                      key="step-number"
                      initial={reduced ? false : { opacity: 0, scale: 0.55 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.55 }}
                      transition={{
                        ...(reduced ? REDUCED_TRANSITION : FADE_TRANSITION),
                        delay: reduced
                          ? 0
                          : 0.12 + Math.min(index, 5) * MOTION_STAGGER,
                      }}
                      className="text-[11px] font-bold leading-none"
                      aria-hidden="true"
                    >
                      {(index + 1).toLocaleString("fa-IR")}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </motion.span>
            ))}
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={`${uid}-steps`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={transition}
              className="overflow-hidden"
            >
              <div className="space-y-1 px-3 pb-4">
                {remaining.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: reduced ? 0 : 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      ...transition,
                      delay: reduced ? 0 : Math.min(index, 5) * MOTION_STAGGER,
                    }}
                  >
                    <Link
                      href={step.href}
                      className="flex min-h-14 items-center gap-3 rounded-2xl px-3 py-3 text-sm no-underline outline-none transition-colors hover:bg-surface-secondary focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                        {(index + 1).toLocaleString("fa-IR")}
                      </span>
                      <span className="flex-1">{step.title}</span>
                      <Icon
                        name="chevron-left"
                        size={18}
                        className="text-muted"
                      />
                    </Link>
                  </motion.div>
                ))}
                {!remaining.length && (
                  <p className="px-3 py-4 text-sm text-muted">
                    همه موارد تکمیل شده‌اند.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </LayoutGroup>
  );
}
