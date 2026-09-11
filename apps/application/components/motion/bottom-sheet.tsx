"use client";

// Adapted from https://beui.dev/components/motion/bottom-sheet
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useDragControls,
  useReducedMotion,
} from "motion/react";
import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@theme/icon";
import { cn } from "@/lib/cn";

import {
  CONTROL_TRANSITION,
  FADE_TRANSITION,
  REDUCED_TRANSITION,
} from "@/lib/ease";
const subscribeToMount = () => () => undefined;

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoints?: (number | "auto")[];
  defaultSnap?: number;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  dismissThreshold?: number;
}

export function BottomSheet({
  open,
  onOpenChange,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  title,
  description,
  headerAction,
  children,
  className,
  contentClassName,
  dismissThreshold = 120,
}: BottomSheetProps) {
  const [snap, setSnap] = useState(defaultSnap);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const titleId = `${uid}-title`;
  const descriptionId = `${uid}-description`;

  const changeRef = useRef(onOpenChange);
  useEffect(() => {
    changeRef.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!open) return;

    const scrollRoot = document.querySelector<HTMLElement>(".app-scroll-root");
    const previousOverflow = scrollRoot?.style.overflow;
    scrollRoot?.style.setProperty("overflow", "hidden");

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const isTopSheet = () =>
      Array.from(document.querySelectorAll('[data-bottom-sheet="true"]')).at(
        -1,
      ) === sheetRef.current;
    const frame = requestAnimationFrame(() => sheetRef.current?.focus());
    const focusable = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
        ) ?? [],
      ).filter((node) => node.getClientRects().length > 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopSheet()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        changeRef.current(false);
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first || !last) {
          event.preventDefault();
          sheetRef.current?.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === sheetRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === sheetRef.current)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const keepFocus = (event: FocusEvent) => {
      if (
        isTopSheet() &&
        event.target instanceof Node &&
        !sheetRef.current?.contains(event.target)
      )
        sheetRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", keepFocus);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", keepFocus);
      if (scrollRoot) scrollRoot.style.overflow = previousOverflow ?? "";
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const { y: velocity } = info.velocity;
    const { y: offset } = info.offset;

    if (velocity > 600 || offset > dismissThreshold) {
      const smallerSnap = snap - 1;
      if (
        smallerSnap >= 0 &&
        velocity < 800 &&
        offset < dismissThreshold * 1.6
      ) {
        setSnap(smallerSnap);
      } else {
        onOpenChange(false);
      }
      return;
    }

    if (velocity < -500) {
      setSnap((current) => Math.min(snapPoints.length - 1, current + 1));
      return;
    }

    setSnap((current) => {
      if (offset > 80 && current > 0) return current - 1;
      if (offset < -80 && current < snapPoints.length - 1) return current + 1;
      return current;
    });
  };

  const snapValue = snapPoints[snap] ?? snapPoints[0] ?? 0.5;
  const heightStyle =
    snapValue === "auto"
      ? {
          maxHeight:
            "min(92dvh, calc(100dvh - var(--keyboard-inset, 0px) - var(--app-safe-top) - 1rem))",
        }
      : {
          height: `min(${snapValue * 100}dvh, calc(100dvh - var(--keyboard-inset, 0px) - var(--app-safe-top) - 1rem))`,
        };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence onExitComplete={() => setSnap(defaultSnap)}>
      {open ? (
        <>
          <motion.button
            key="bottom-sheet-backdrop"
            type="button"
            aria-label="بستن"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? REDUCED_TRANSITION : FADE_TRANSITION}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[1000] bg-background/65 backdrop-blur-sm"
          />
          <motion.div
            key="bottom-sheet"
            ref={sheetRef}
            tabIndex={-1}
            data-bottom-sheet="true"
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: "100%" }}
            transition={reduceMotion ? REDUCED_TRANSITION : CONTROL_TRANSITION}
            style={heightStyle}
            className={cn(
              "fixed inset-x-0 bottom-[var(--keyboard-inset,0px)] z-[1001] mx-auto flex w-full max-w-xl translate-z-0 flex-col contain-paint rounded-t-[2.25rem] bg-surface text-surface-foreground shadow-[0_-16px_60px_-24px_rgba(0,0,0,0.45)] outline-none will-change-transform",
              className,
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            aria-label={title ? undefined : "Bottom sheet"}
          >
            <div className="flex shrink-0 flex-col items-center px-5 pb-3 pt-4">
              <div
                onPointerDown={(event) => dragControls.start(event)}
                className="flex cursor-grab touch-none items-center justify-center px-8 py-2 active:cursor-grabbing"
              >
                <div className="h-1.5 w-12 rounded-full bg-muted/40" />
              </div>
              {title || description ? (
                <div className="mt-3 flex w-full items-start gap-3 text-start">
                  <div className="min-w-0 flex-1">
                    {title ? (
                      <h2 id={titleId} className="text-xl font-semibold">
                        {title}
                      </h2>
                    ) : null}
                    {description ? (
                      <p id={descriptionId} className="mt-1 text-sm text-muted">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {headerAction ?? (
                      <button
                        type="button"
                        aria-label="بستن"
                        onClick={() => onOpenChange(false)}
                        className="grid size-10 place-items-center rounded-2xl bg-surface-secondary text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus"
                      >
                        <Icon name="close-x" size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div
              className={cn(
                "min-h-0 flex-1 scroll-pt-3 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+var(--app-safe-bottom))]",
                contentClassName,
              )}
            >
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
