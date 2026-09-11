"use client";

import { useId, useState, type ElementType, type ReactNode } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { CONTROL_TRANSITION, REDUCED_TRANSITION } from "@/lib/ease";

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
  const transition = reduced ? REDUCED_TRANSITION : CONTROL_TRANSITION;
  const active = cards.find((card) => card.id === activeId);
  const orderedCards = active
    ? [active, ...cards.filter((card) => card.id !== active.id)]
    : cards;

  return (
    <LayoutGroup id={id}>
      <motion.div
        layout={!reduced}
        className="grid w-full grid-cols-2 items-start gap-3"
        transition={transition}
        onKeyDown={(event) => {
          if (event.key === "Escape") setActiveId(null);
        }}
      >
        {orderedCards.map((card) => {
          const expanded = active?.id === card.id;
          const detailsId = `${id}-${cards.indexOf(card)}-details`;

          return (
            <motion.div
              key={card.id}
              layout={!reduced}
              transition={transition}
              className={cn(
                "min-w-0 overflow-hidden rounded-[calc(var(--radius)*4)]",
                expanded
                  ? "col-span-2 bg-accent text-accent-foreground"
                  : "bg-surface text-foreground",
                card.color,
              )}
            >
              <motion.button
                type="button"
                aria-expanded={expanded}
                aria-controls={expanded ? detailsId : undefined}
                onClick={() => setActiveId(expanded ? null : card.id)}
                whileTap={reduced ? undefined : { scale: 0.98 }}
                className={cn(
                  "flex w-full min-w-0 flex-col items-start justify-between gap-4 rounded-[inherit] p-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus sm:p-5",
                  expanded
                    ? "min-h-40"
                    : active
                      ? "min-h-28"
                      : "min-h-36 sm:min-h-40",
                )}
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid shrink-0 place-items-center rounded-full",
                      active && !expanded ? "size-8" : "size-10",
                      expanded
                        ? "bg-accent-foreground/10"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    <card.icon size={active && !expanded ? 18 : 24} />
                  </span>
                  <span
                    aria-hidden="true"
                    className="grid size-8 place-items-center rounded-full bg-current/5"
                  >
                    {expanded ? <X size={18} /> : <MoreHorizontal size={18} />}
                  </span>
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span
                    className={cn(
                      "break-words font-extrabold",
                      active && !expanded ? "text-base" : "text-xl sm:text-2xl",
                    )}
                  >
                    {card.value}
                  </span>
                  <span
                    className={cn(
                      "text-xs leading-5",
                      expanded ? "text-accent-foreground/75" : "text-muted",
                    )}
                  >
                    {card.title}
                  </span>
                </span>
              </motion.button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    key="details"
                    id={detailsId}
                    role="region"
                    aria-label={card.title}
                    initial={{ opacity: 0, height: reduced ? "auto" : 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: reduced ? "auto" : 0 }}
                    transition={transition}
                  >
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                      <div className="border-t border-accent-foreground/15 pt-3 text-sm leading-7 text-accent-foreground/80">
                        {card.description ?? card.value}
                      </div>
                      {(onCopyClick || onCustomizeClick) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {onCopyClick && (
                            <button
                              type="button"
                              onClick={() => onCopyClick(card)}
                              className="min-h-11 rounded-full bg-accent-foreground/10 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus"
                            >
                              کپی
                            </button>
                          )}
                          {onCustomizeClick && (
                            <button
                              type="button"
                              onClick={() => onCustomizeClick(card)}
                              className="min-h-11 rounded-full bg-accent-foreground/10 px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-focus"
                            >
                              ویرایش
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </LayoutGroup>
  );
}
