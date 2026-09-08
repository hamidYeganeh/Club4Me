"use client";

import { useId, useState, type ElementType, type ReactNode } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/cn";

export interface CarouselCard {
  id: string;
  title: string;
  value: string;
  color?: string;
  icon: ElementType;
  description?: ReactNode;
}

export function MinimalCarousel({
  cards,
  onCopyClick,
  onCustomizeClick,
}: {
  cards: CarouselCard[];
  onCopyClick?: (card: CarouselCard) => void;
  onCustomizeClick?: (card: CarouselCard) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const id = useId();
  const reduced = useReducedMotion();
  const transition = {
    duration: reduced ? 0 : 0.35,
    ease: [0.32, 0.72, 0, 1] as const,
  };
  const active = cards.find((card) => card.id === activeId);
  return (
    <LayoutGroup id={id}>
      <motion.div
        layout
        className="grid w-full grid-cols-2 gap-3"
        transition={transition}
      >
        {cards.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            layout
            aria-expanded={activeId === card.id}
            aria-controls={`${id}-details`}
            onClick={() => setActiveId(activeId === card.id ? null : card.id)}
            transition={transition}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            className={cn(
              "flex min-h-32 min-w-0 flex-col items-start gap-3 rounded-3xl p-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-focus",
              activeId === card.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface text-foreground",
              card.color,
            )}
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-2xl",
                activeId === card.id
                  ? "bg-background/10"
                  : "bg-accent text-accent-foreground",
              )}
            >
              <card.icon size={22} />
            </span>
            <span className="text-lg font-extrabold">{card.value}</span>
            <span className="text-xs opacity-70">{card.title}</span>
          </motion.button>
        ))}
        <AnimatePresence initial={false}>
          {active && (
            <motion.div
              id={`${id}-details`}
              key={active.id}
              layout
              role="region"
              aria-label={active.title}
              initial={{ opacity: 0, y: reduced ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="col-span-2 rounded-3xl bg-surface-secondary p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">{active.title}</h3>
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="rounded-xl px-3 py-2 text-sm text-accent focus-visible:outline-2"
                >
                  بستن
                </button>
              </div>
              <div className="mt-2 text-sm leading-7 text-muted">
                {active.description ?? active.value}
              </div>
              {onCopyClick && (
                <button
                  type="button"
                  onClick={() => onCopyClick(active)}
                  className="mt-3 rounded-xl bg-accent px-4 py-2 text-accent-foreground"
                >
                  کپی
                </button>
              )}
              {onCustomizeClick && (
                <button
                  type="button"
                  onClick={() => onCustomizeClick(active)}
                  className="mt-3 rounded-xl bg-accent px-4 py-2 text-accent-foreground"
                >
                  ویرایش
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
